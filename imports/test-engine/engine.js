// Chatgpt by openAI was used to assist in the writing the code for the following file
import { MQTTTester } from "./protocols/mqtt";
import { HTTPTester } from "./protocols/http";
import { WebSocketTester } from "./protocols/websocket";
import { CoAPTester } from "./protocols/coap";
import { NetworkSimulator } from "./network-simulator";

export class TestEngine {
  constructor(configuration) {
    this.configuration = configuration;
    this.results = [];
    this.networkSimulator = new NetworkSimulator();
  }

  // Note: runAllTests is now handled in the Meteor method to allow progress updates
  // This method is kept for compatibility but tests are run individually in tests.js
  async runAllTests() {
    const { selectedProtocols, scenarios } = this.configuration;
    const allResults = [];

    // Run tests for each protocol and scenario combination
    for (const protocolName of selectedProtocols) {
      for (const scenario of scenarios) {
        const result = await this.runTest(protocolName, scenario);
        allResults.push(result);
      }
    }

    this.results = allResults;
    return allResults;
  }

  async runTest(protocolName, scenario, testRunId = null) {
    const tester = this.getTester(protocolName);
    if (!tester) {
      throw new Error(`Unsupported protocol: ${protocolName}`);
    }

    // Log setup
    if (testRunId) {
      const { Meteor } = require("meteor/meteor");
      Meteor.call("testLogs.add", testRunId, {
        type: "setup",
        message: `Initializing ${protocolName} tester`,
        protocol: protocolName
      });
    }

    // Apply network conditions from scenario
    const networkConditions = this.getNetworkConditions(scenario);
    this.networkSimulator.setConditions(networkConditions);

    if (testRunId) {
      const { Meteor } = require("meteor/meteor");
      Meteor.call("testLogs.add", testRunId, {
        type: "setup",
        message: `Applying network conditions: ${JSON.stringify(
          networkConditions
        )}`,
        protocol: protocolName,
        networkConditions
      });
    }

    const startTime = Date.now();

    // Get protocol-specific configuration from environment or configuration
    const protocolConfig = this.configuration?.protocolConfig || {};

    const metrics = await tester.runBenchmark({
      messageCount: scenario.messageFrequency || 100,
      messageSize: scenario.messageSize || 1024,
      duration: scenario.duration || 5000,
      networkSimulator: this.networkSimulator,
      testRunId, // Pass testRunId for detailed logging
      brokerUrl: protocolConfig.mqttBrokerUrl, // Optional MQTT broker URL override
      httpEndpoint: protocolConfig.httpEndpoint, // Optional HTTP endpoint override
      websocketUrl: protocolConfig.websocketUrl, // Optional WebSocket URL override
      coapServerUrl: protocolConfig.coapServerUrl // Optional CoAP server URL override
    });

    const endTime = Date.now();
    metrics.testDuration = endTime - startTime;

    if (testRunId) {
      const { Meteor } = require("meteor/meteor");
      Meteor.call("testLogs.add", testRunId, {
        type: "calculate",
        message: `Calculated metrics for ${protocolName}`,
        protocol: protocolName,
        metrics,
        duration: metrics.testDuration
      });
    }

    return {
      protocol: protocolName,
      scenario: scenario.name || scenario,
      metrics
    };
  }

  getTester(protocolName) {
    switch (protocolName.toUpperCase()) {
      case "MQTT":
        return new MQTTTester();
      case "HTTP":
        return new HTTPTester();
      case "WEBSOCKET":
      case "WS":
        return new WebSocketTester();
      case "COAP":
        return new CoAPTester();
      default:
        return null;
    }
  }

  getNetworkConditions(scenario) {
    return {
      packetLoss: scenario.packetLoss || 0,
      latency: scenario.latency || 0,
      jitter: scenario.jitter || 0,
      bandwidth: scenario.bandwidth || Infinity,
      unstable: scenario.unstable || false
    };
  }

  calculateFitnessScores(attributes) {
    if (!this.results || this.results.length === 0) {
      return {};
    }

    const protocolScores = {};
    const normalizedResults = this.normalizeResults();

    // Group results by protocol
    const protocolResults = {};
    this.results.forEach((result) => {
      if (!protocolResults[result.protocol]) {
        protocolResults[result.protocol] = [];
      }
      protocolResults[result.protocol].push(result.metrics);
    });

    // Calculate fitness score for each protocol
    Object.keys(protocolResults).forEach((protocol) => {
      const avgMetrics = this.averageMetrics(protocolResults[protocol]);
      let fitnessScore = 0;
      let totalWeight = 0;

      attributes.forEach((attr) => {
        const weight = attr.weight || 0;
        if (weight > 0 && avgMetrics[attr.name]) {
          const normalizedValue = this.normalizeAttribute(
            attr.name,
            avgMetrics[attr.name],
            normalizedResults
          );
          fitnessScore += normalizedValue * (weight / 100);
          totalWeight += weight / 100;
        }
      });

      // Normalize to 0-100 scale
      if (totalWeight > 0) {
        fitnessScore = (fitnessScore / totalWeight) * 100;
      }

      protocolScores[protocol] = {
        score: Math.round(fitnessScore),
        metrics: avgMetrics,
        recommendation: this.generateRecommendation(
          protocol,
          fitnessScore,
          avgMetrics
        )
      };
    });

    return protocolScores;
  }

  normalizeResults() {
    // Find min/max values across all protocols for normalization
    const allMetrics = this.results.flatMap((r) => Object.entries(r.metrics));
    const normalized = {};

    [
      "latency",
      "throughput",
      "jitter",
      "reliability",
      "dataIntegrity",
      "resourceUsage",
      "securityOverhead"
    ].forEach((metric) => {
      const values = allMetrics
        .filter(([key]) => key === metric)
        .map(([, value]) => (typeof value === "number" ? value : 0))
        .filter((v) => !isNaN(v) && isFinite(v));

      if (values.length > 0) {
        normalized[metric] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return normalized;
  }

  normalizeAttribute(name, value, normalizedResults) {
    const norm = normalizedResults[name];
    if (!norm || norm.max === norm.min) return 0.5;

    // For attributes where lower is better (latency, jitter)
    if (
      ["latency", "jitter", "resourceUsage", "securityOverhead"].includes(name)
    ) {
      return 1 - (value - norm.min) / (norm.max - norm.min);
    }

    // For attributes where higher is better (throughput, reliability)
    return (value - norm.min) / (norm.max - norm.min);
  }

  averageMetrics(metricsArray) {
    const avg = {};
    const keys = Object.keys(metricsArray[0] || {});

    keys.forEach((key) => {
      const values = metricsArray
        .map((m) => m[key])
        .filter((v) => typeof v === "number" && !isNaN(v));
      if (values.length > 0) {
        avg[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });

    return avg;
  }

  generateRecommendation(protocol, score, metrics) {
    if (score >= 80) {
      return `Excellent choice for your requirements. ${protocol} demonstrates strong performance across prioritized attributes.`;
    } else if (score >= 60) {
      return `Good fit for your requirements. ${protocol} performs well but may have trade-offs in some areas.`;
    } else {
      return `May not be optimal for your requirements. Consider other protocols that better align with your priorities.`;
    }
  }
}
