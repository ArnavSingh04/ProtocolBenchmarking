// Inline, stateless benchmark runner.
//
// Unlike the retired runService/mongo design, this holds NO cross-request
// state: it runs a benchmark to completion inside a single request and streams
// every progress event out through the `emit` callback. The client reconstructs
// and persists the run locally, so nothing needs a shared server-side store.
// That is what makes the app work on serverless hosts (e.g. Vercel) with no DB.

import { TestEngine } from "../../imports/test-engine/engine";
import { computeFitnessScores, countSuccessful } from "../../imports/shared/metrics";
import { registerRunLogger, unregisterRunLogger } from "./meteorShim";

function now() {
  return new Date().toISOString();
}

/**
 * Run a benchmark, emitting events as it progresses. Always terminates by
 * emitting a single `done` event (status "completed" or "failed") — it does not
 * throw for benchmark-level failures, so streaming consumers get a clean end.
 *
 * emit(event) receives, in order:
 *   { type: "progress", payload: { current, total, currentProtocol, currentScenario, completed } }
 *   { type: "log",      payload: <log entry with an ISO `timestamp`> }
 *   { type: "result",   payload: { protocol, scenario, metrics, timestamp } }
 *   { type: "done",     payload: { status, error, results, progress, endTime } }
 *
 * @param {object} configuration normalised benchmark configuration
 * @param {(event: {type: string, payload: object}) => void} emit
 * @param {{ testRunId?: string|null }} [options]
 */
export async function runBenchmark(configuration, emit, options = {}) {
  const testRunId = options.testRunId || null;

  const emitSafe = (event) => {
    try {
      emit(event);
    } catch {
      // Never let a consumer/stream error abort the benchmark.
    }
  };

  const onLog = (entry) => {
    if (!entry) return;
    emitSafe({ type: "log", payload: { ...entry, timestamp: now() } });
  };

  // Live protocol testers log through the Meteor shim registry, keyed by run id.
  if (testRunId) registerRunLogger(testRunId, onLog);

  const engine = new TestEngine(configuration, { onLog });
  const selectedProtocols = Array.isArray(configuration.selectedProtocols)
    ? configuration.selectedProtocols
    : [];
  const scenarios = Array.isArray(configuration.scenarios)
    ? configuration.scenarios
    : [];
  const totalTests = selectedProtocols.length * scenarios.length;

  emitSafe({
    type: "progress",
    payload: {
      current: 0,
      total: totalTests,
      currentProtocol: null,
      currentScenario: null,
      completed: 0
    }
  });

  const allResults = [];
  let completedTests = 0;

  try {
    for (const protocolName of selectedProtocols) {
      for (const scenario of scenarios) {
        completedTests += 1;
        const scenarioName = scenario?.name || scenario;

        emitSafe({
          type: "progress",
          payload: {
            current: completedTests,
            total: totalTests,
            currentProtocol: protocolName,
            currentScenario: scenarioName,
            completed: completedTests - 1
          }
        });

        const result = await engine.runTest(protocolName, scenario, testRunId);
        allResults.push(result);

        emitSafe({
          type: "result",
          payload: {
            protocol: result.protocol,
            scenario: result.scenario,
            metrics: result.metrics,
            timestamp: now()
          }
        });

        emitSafe({
          type: "progress",
          payload: {
            current: completedTests,
            total: totalTests,
            currentProtocol: protocolName,
            currentScenario: scenarioName,
            completed: completedTests
          }
        });
      }
    }

    engine.results = allResults;
    const fitnessScores = computeFitnessScores(allResults, configuration.attributes);
    const successfulCount = countSuccessful(fitnessScores);
    const allFailed = successfulCount === 0 && allResults.length > 0;

    emitSafe({
      type: "done",
      payload: {
        status: allFailed ? "failed" : "completed",
        error: allFailed
          ? "No protocol produced usable data. Check endpoints (live mode) or logs."
          : null,
        results: fitnessScores,
        progress: {
          current: totalTests,
          total: totalTests,
          currentProtocol: null,
          currentScenario: null,
          completed: totalTests
        },
        endTime: now()
      }
    });
  } catch (error) {
    // Unexpected engine error — still emit a terminal event so the client's
    // run never gets stuck as "running".
    console.error(`[benchmarkRunner] run ${testRunId || "?"} failed:`, error);
    emitSafe({
      type: "done",
      payload: {
        status: "failed",
        error: error?.message || "The benchmark failed to complete.",
        results: {},
        endTime: now()
      }
    });
  } finally {
    if (testRunId) unregisterRunLogger(testRunId);
  }
}
