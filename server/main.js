// Chatgpt by openAI was used to assist in the writing the code for the following file
import { Meteor } from "meteor/meteor";
import "../imports/api/protocols";
import { TestRuns, TestResults } from "../imports/api/tests";
import { TestLogs } from "../imports/api/testLogs";
import "../imports/startup/accounts";

// Publish collections for reactive data
Meteor.publish("testRuns", function (testRunId) {
  // If testRunId provided, publish that specific test run
  if (testRunId) {
    return TestRuns.find({ _id: testRunId });
  }
  // Otherwise publish all test runs for this user (or all if no user)
  return TestRuns.find(
    { userId: this.userId || null },
    { sort: { startTime: -1 }, limit: 50 }
  );
});

Meteor.publish("testResults", function (testRunId) {
  // Always require testRunId for results to avoid publishing too much data
  if (testRunId) {
    return TestResults.find({ testRunId });
  }
  // Return empty cursor if no testRunId
  return TestResults.find({ _id: "nonexistent" }); // Empty cursor
});

Meteor.publish("testLogs", function (testRunId) {
  if (testRunId) {
    return TestLogs.find(
      { testRunId },
      { sort: { timestamp: 1 }, limit: 1000 }
    );
  }
  return TestLogs.find({ _id: "nonexistent" }); // Empty cursor
});

Meteor.startup(async () => {
  // Server startup code
  console.log("Protocol Comparison Tool server started");
});
