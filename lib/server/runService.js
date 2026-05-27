import { randomUUID } from "crypto";
import { TestEngine } from "../../imports/test-engine/engine";
import { getCollections } from "./mongo";
import { runEventBus } from "./eventBus";
import { setMeteorCallHandler } from "./meteorShim";

let indexesReady = false;
let protocolsSeeded = false;

async function ensureDbSetup() {
  const { testRuns, testResults, testLogs, protocols } = await getCollections();

  if (!indexesReady) {
    await Promise.all([
      testRuns.createIndex({ startTime: -1 }),
      testResults.createIndex({ testRunId: 1 }),
      testLogs.createIndex({ testRunId: 1, timestamp: 1 })
    ]);
    indexesReady = true;
  }

  if (!protocolsSeeded) {
    const protocolCount = await protocols.countDocuments();
    if (protocolCount === 0) {
      await protocols.insertMany([
        {
          name: "MQTT",
          description: "Message Queuing Telemetry Transport",
          supported: true,
          features: ["QoS levels", "Pub/Sub", "Lightweight"]
        },
        {
          name: "HTTP",
          description: "Hypertext Transfer Protocol",
          supported: true,
          features: ["Request/Response", "RESTful", "Widely supported"]
        },
        {
          name: "WebSocket",
          description: "Full-duplex communication protocol",
          supported: true,
          features: ["Full-duplex", "Low latency", "Real-time"]
        },
        {
          name: "CoAP",
          description: "Constrained Application Protocol",
          supported: true,
          features: ["IoT optimized", "UDP-based", "Low overhead"]
        }
      ]);
    }
    protocolsSeeded = true;
  }
}

async function emitRunUpdated(testRunId) {
  const testRun = await getRunById(testRunId);
  if (testRun) {
    runEventBus.emit(`run:${testRunId}`, {
      type: "run_updated",
      payload: testRun
    });
  }
}

export async function addLog(testRunId, logEntry) {
  const { testLogs } = await getCollections();
  const document = {
    _id: randomUUID(),
    testRunId,
    timestamp: new Date(),
    ...logEntry
  };
  await testLogs.insertOne(document);
  runEventBus.emit(`run:${testRunId}`, {
    type: "log_added",
    payload: document
  });
}

async function addResult(testRunId, result) {
  const { testResults } = await getCollections();
  const document = {
    _id: randomUUID(),
    testRunId,
    protocol: result.protocol,
    scenario: result.scenario,
    metrics: result.metrics,
    timestamp: new Date()
  };
  await testResults.insertOne(document);
  runEventBus.emit(`run:${testRunId}`, {
    type: "result_added",
    payload: document
  });
}

async function updateRun(testRunId, updates) {
  const { testRuns } = await getCollections();
  await testRuns.updateOne({ _id: testRunId }, updates);
  await emitRunUpdated(testRunId);
}

async function createUniqueRunId(testRuns, preferredId = null) {
  if (preferredId) {
    const existing = await testRuns.findOne({ _id: preferredId });
    if (!existing) {
      return preferredId;
    }
  }

  let candidate = randomUUID();
  // Extremely unlikely to collide, but loop defensively.
  while (await testRuns.findOne({ _id: candidate })) {
    candidate = randomUUID();
  }
  return candidate;
}

export async function startRun(
  configuration,
  userId = null,
  requestedTestRunId = null
) {
  await ensureDbSetup();
  const { testRuns } = await getCollections();

  const testRunId = await createUniqueRunId(testRuns, requestedTestRunId);
  await testRuns.insertOne({
    _id: testRunId,
    userId: userId || null,
    configuration,
    status: "running",
    startTime: new Date(),
    protocols: configuration.selectedProtocols,
    attributes: configuration.attributes,
    scenarios: configuration.scenarios
  });

  await emitRunUpdated(testRunId);

  const runTests = () =>
    executeTests(testRunId).catch(async (error) => {
      await updateRun(testRunId, {
        $set: {
          status: "failed",
          error: error.message,
          endTime: new Date()
        }
      });
    });

  // Start immediately; avoid setTimeout which may not run on serverless hosts.
  void runTests();

  return testRunId;
}

export async function executeTests(testRunId) {
  await ensureDbSetup();
  const testRun = await getRunById(testRunId);
  if (!testRun) {
    throw new Error("test-run-not-found");
  }

  setMeteorCallHandler((methodName, callTestRunId, payload) => {
    if (methodName === "testLogs.add" && callTestRunId) {
      return addLog(callTestRunId, payload || {});
    }
    return null;
  });

  const engine = new TestEngine(testRun.configuration);
  const { selectedProtocols, scenarios } = testRun.configuration;
  const totalTests = selectedProtocols.length * scenarios.length;
  let completedTests = 0;

  await updateRun(testRunId, {
    $set: {
      progress: {
        current: 0,
        total: totalTests,
        currentProtocol: null,
        currentScenario: null,
        completed: 0
      }
    }
  });

  const allResults = [];

  try {
    for (const protocolName of selectedProtocols) {
      for (const scenario of scenarios) {
        completedTests += 1;
        await addLog(testRunId, {
          type: "setup",
          message: `Setting up ${protocolName} test`,
          protocol: protocolName,
          scenario: scenario.name || scenario,
          testNumber: completedTests,
          totalTests
        });

        await updateRun(testRunId, {
          $set: {
            progress: {
              current: completedTests,
              total: totalTests,
              currentProtocol: protocolName,
              currentScenario: scenario.name || scenario,
              completed: completedTests
            }
          }
        });

        const result = await engine.runTest(protocolName, scenario, testRunId);
        allResults.push(result);
        await addResult(testRunId, result);

        await addLog(testRunId, {
          type: "complete",
          message: `Completed ${protocolName} test`,
          protocol: protocolName,
          scenario: scenario.name || scenario,
          metrics: result.metrics
        });
      }
    }

    engine.results = allResults;
    const fitnessScores = engine.calculateFitnessScores(
      testRun.configuration.attributes
    );

    await updateRun(testRunId, {
      $set: {
        status: "completed",
        endTime: new Date(),
        results: fitnessScores,
        progress: {
          current: totalTests,
          total: totalTests,
          currentProtocol: null,
          currentScenario: null,
          completed: totalTests
        }
      }
    });
  } catch (error) {
    await updateRun(testRunId, {
      $set: {
        status: "failed",
        error: error.message,
        endTime: new Date()
      }
    });
    throw error;
  } finally {
    setMeteorCallHandler(null);
  }
}

export async function getRunById(testRunId) {
  const { testRuns } = await getCollections();
  return testRuns.findOne({ _id: testRunId });
}

export async function getRunResults(testRunId) {
  const { testResults } = await getCollections();
  return testResults.find({ testRunId }).toArray();
}

export async function getRunLogs(testRunId) {
  const { testLogs } = await getCollections();
  return testLogs
    .find({ testRunId }, { sort: { timestamp: 1 }, limit: 1000 })
    .toArray();
}

export async function getHistory() {
  const { testRuns } = await getCollections();
  return testRuns.find({}, { sort: { startTime: -1 }, limit: 50 }).toArray();
}
