import { MQTTTester } from "./protocols/mqtt";
import { HTTPTester } from "./protocols/http";
import { WebSocketTester } from "./protocols/websocket";
import { CoAPTester } from "./protocols/coap";
import { NetworkSimulator } from "./network-simulator";
import { simulateBenchmark } from "./simulation";
import { computeFitnessScores } from "../shared/metrics";

const LIVE_TESTERS = {
  MQTT: MQTTTester,
  HTTP: HTTPTester,
  WEBSOCKET: WebSocketTester,
  WS: WebSocketTester,
  COAP: CoAPTester
};

function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TestEngine {
  constructor(configuration = {}, options = {}) {
    this.configuration = configuration;
    this.results = [];
    this.networkSimulator = new NetworkSimulator();
    // Logger is injected so the engine has no hard dependency on the Meteor
    // shim (which resolves via a bundler alias, not Node's require).
    this.onLog = typeof options.onLog === "function" ? options.onLog : null;
    // "simulation" (default) is deterministic and offline; "live" contacts the
    // configured external endpoints via the protocol testers.
    this.mode = configuration.mode === "live" ? "live" : "simulation";

    const configuredStep = Number(process.env.SIM_STEP_MS);
    if (configuration.fast || process.env.NODE_ENV === "test") {
      this.simStepMs = 0;
    } else if (Number.isFinite(configuredStep)) {
      this.simStepMs = configuredStep;
    } else {
      this.simStepMs = 220;
    }
  }

  // Accepts either log(entry) or the legacy log(testRunId, entry) shape.
  log(testRunIdOrEntry, maybeEntry) {
    const entry = maybeEntry !== undefined ? maybeEntry : testRunIdOrEntry;
    if (this.onLog && entry) this.onLog(entry);
  }

  async runTest(protocolName, scenario, testRunId = null) {
    if (this.mode === "live") {
      return this.runLiveTest(protocolName, scenario, testRunId);
    }
    return this.runSimulatedTest(protocolName, scenario, testRunId);
  }

  async runSimulatedTest(protocolName, scenario, testRunId) {
    const scenarioName = scenario?.name || scenario;
    const startTime = Date.now();

    // Deterministic failure hook (used by tests/demos to exercise the failure
    // path). Not surfaced in the UI; produces an honest "failed" result.
    const failList = (this.configuration.failProtocols || []).map((p) =>
      String(p).toUpperCase()
    );
    if (failList.includes(String(protocolName).toUpperCase())) {
      this.log(testRunId, {
        type: "error",
        message: `${protocolName} failed to produce data (simulated failure)`,
        protocol: protocolName,
        scenario: scenarioName
      });
      return {
        protocol: protocolName,
        scenario: scenarioName,
        metrics: {
          latency: 0,
          jitter: 0,
          reliability: 0,
          throughput: 0,
          ordering: 0,
          dataIntegrity: 0,
          resourceUsage: 0,
          securityOverhead: 0,
          error: "Simulated failure",
          simulated: true
        }
      };
    }

    this.log(testRunId, {
      type: "setup",
      message: `Preparing ${protocolName} under "${scenarioName}" (simulated model)`,
      protocol: protocolName,
      scenario: scenarioName
    });

    const networkConditions = this.getNetworkConditions(scenario);
    this.log(testRunId, {
      type: "connect",
      message: `Applying network profile: ${networkConditions.latency}ms latency, ${networkConditions.packetLoss}% loss, ${networkConditions.jitter}ms jitter`,
      protocol: protocolName,
      networkConditions
    });
    await sleep(this.simStepMs);

    const messageSize = this.configuration?.messageSize || scenario?.messageSize || 1024;
    const messageCount = Math.min(
      scenario?.messageFrequency || this.configuration?.messageFrequency || 100,
      500
    );

    const metrics = simulateBenchmark({
      protocol: protocolName,
      scenario,
      messageSize
    });

    const delivered = Math.round((metrics.reliability / 100) * messageCount);
    this.log(testRunId, {
      type: "send",
      message: `Exchanged ${messageCount} messages (${delivered} delivered)`,
      protocol: protocolName,
      sentCount: messageCount,
      receivedCount: delivered
    });
    await sleep(this.simStepMs);

    metrics.testDuration = Date.now() - startTime;

    this.log(testRunId, {
      type: "calculate",
      message: `Modelled metrics for ${protocolName}`,
      protocol: protocolName,
      metrics,
      formula:
        "Latency = network×factor + processing; Reliability = base − unrecovered loss; Throughput = base × reliability × load"
    });

    this.log(testRunId, {
      type: "complete",
      message: `Completed ${protocolName} on "${scenarioName}"`,
      protocol: protocolName,
      scenario: scenarioName,
      metrics
    });

    return { protocol: protocolName, scenario: scenarioName, metrics };
  }

  async runLiveTest(protocolName, scenario, testRunId) {
    const tester = this.getTester(protocolName);
    if (!tester) {
      throw new Error(`Unsupported protocol: ${protocolName}`);
    }

    this.log(testRunId, {
      type: "setup",
      message: `Initializing ${protocolName} tester (live)`,
      protocol: protocolName
    });

    const networkConditions = this.getNetworkConditions(scenario);
    this.networkSimulator.setConditions(networkConditions);
    this.log(testRunId, {
      type: "setup",
      message: `Applying network conditions: ${JSON.stringify(networkConditions)}`,
      protocol: protocolName,
      networkConditions
    });

    const startTime = Date.now();
    const protocolConfig = this.configuration?.protocolConfig || {};

    const metrics = await tester.runBenchmark({
      messageCount: scenario.messageFrequency || 100,
      messageSize: scenario.messageSize || 1024,
      duration: scenario.duration || 5000,
      networkSimulator: this.networkSimulator,
      testRunId,
      brokerUrl: protocolConfig.mqttBrokerUrl,
      httpEndpoint: protocolConfig.httpEndpoint,
      websocketUrl: protocolConfig.websocketUrl,
      coapServerUrl: protocolConfig.coapServerUrl
    });

    metrics.testDuration = Date.now() - startTime;
    metrics.simulated = false;

    this.log(testRunId, {
      type: metrics.error ? "error" : "calculate",
      message: metrics.error
        ? `${protocolName} failed: ${metrics.error}`
        : `Calculated metrics for ${protocolName}`,
      protocol: protocolName,
      metrics,
      duration: metrics.testDuration
    });

    return {
      protocol: protocolName,
      scenario: scenario.name || scenario,
      metrics
    };
  }

  getTester(protocolName) {
    const Tester = LIVE_TESTERS[String(protocolName).toUpperCase()];
    return Tester ? new Tester() : null;
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
    return computeFitnessScores(this.results, attributes);
  }
}
