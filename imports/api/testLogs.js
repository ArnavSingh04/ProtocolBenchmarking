// Chatgpt by openAI was used to assist in the writing the code for the following file
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const TestLogs = new Mongo.Collection("testLogs");

// Log types: 'setup', 'connect', 'send', 'receive', 'calculate', 'complete'
Meteor.methods({
  async "testLogs.add"(testRunId, logEntry) {
    const log = {
      testRunId,
      timestamp: new Date(),
      ...logEntry
    };
    return await TestLogs.insertAsync(log);
  }
});
