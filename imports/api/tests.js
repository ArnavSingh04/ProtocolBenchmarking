// Chatgpt by openAI was used to assist in the writing the code for the following file
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const TestRuns = new Mongo.Collection("testRuns");
export const TestResults = new Mongo.Collection("testResults");

const addLog = (testRunId, type, message, details = {}) => {
  Meteor.call("testLogs.add", testRunId, {
    type,
    message,
    ...details
  });
};

// Execute benchmark tests
Meteor.methods({
  async "tests.startRun"({ configuration }) {
    const testRunId = await TestRuns.insertAsync({
      userId: this.userId || null,
      configuration,
      status: "running",
      startTime: new Date(),
      protocols: configuration.selectedProtocols,
      attributes: configuration.attributes,
      scenarios: configuration.scenarios
    });

    // Start the actual test execution
    Meteor.setTimeout(() => {
      Meteor.call("tests.executeTests", testRunId);
    }, 100);

    return testRunId;
  },

  async "tests.executeTests"(testRunId) {
    this.unblock();

    const testRun = await TestRuns.findOneAsync(testRunId);
    if (!testRun) {
      throw new Meteor.Error("test-run-not-found");
    }

    const { TestEngine } = require("../test-engine/engine");

    const engine = new TestEngine(testRun.configuration);

    try {
      const { selectedProtocols, scenarios } = testRun.configuration;
      const totalTests = selectedProtocols.length * scenarios.length;
      let completedTests = 0;

      // Initialize progress
      await TestRuns.updateAsync(testRunId, {
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

      // Run tests for each protocol and scenario combination
      for (const protocolName of selectedProtocols) {
        for (const scenario of scenarios) {
          // Update progress
          completedTests++;

          addLog(testRunId, "setup", `Setting up ${protocolName} test`, {
            protocol: protocolName,
            scenario: scenario.name || scenario,
            testNumber: completedTests,
            totalTests: totalTests
          });

          await TestRuns.updateAsync(testRunId, {
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

          console.log(
            `[Test ${completedTests}/${totalTests}] Running ${protocolName} - ${
              scenario.name || scenario
            }`
          );

          // Pass testRunId to engine for logging
          const result = await engine.runTest(
            protocolName,
            scenario,
            testRunId
          );
          allResults.push(result);

          // Save result immediately
          await TestResults.insertAsync({
            testRunId,
            protocol: result.protocol,
            scenario: result.scenario,
            metrics: result.metrics,
            timestamp: new Date()
          });

          addLog(testRunId, "complete", `Completed ${protocolName} test`, {
            protocol: protocolName,
            scenario: scenario.name || scenario,
            metrics: result.metrics
          });

          console.log(
            `[Test ${completedTests}/${totalTests}] Completed ${protocolName} - ${
              scenario.name || scenario
            }`
          );
        }
      }

      // Calculate fitness scores
      engine.results = allResults;
      const fitnessScores = engine.calculateFitnessScores(
        testRun.configuration.attributes
      );

      // Update test run status
      await TestRuns.updateAsync(testRunId, {
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

      console.log(`[Test Run ${testRunId}] All tests completed`);
      return allResults;
    } catch (error) {
      console.error(`[Test Run ${testRunId}] Error:`, error);
      await TestRuns.updateAsync(testRunId, {
        $set: {
          status: "failed",
          error: error.message,
          endTime: new Date()
        }
      });
      throw error;
    }
  },

  "tests.getResults"(testRunId) {
    return TestResults.find({ testRunId }).fetch();
  },

  async "tests.getTestRun"(testRunId) {
    return await TestRuns.findOneAsync(testRunId);
  },

  "tests.getAllRuns"() {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized");
    }
    return TestRuns.find(
      { userId: this.userId },
      { sort: { startTime: -1 } }
    ).fetch();
  }
});
