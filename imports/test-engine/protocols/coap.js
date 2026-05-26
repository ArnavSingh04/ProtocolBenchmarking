// Chatgpt by openAI was used to assist in the writing the code for the following file
export class CoAPTester {
  async runBenchmark({
    messageCount,
    messageSize,
    duration,
    networkSimulator,
    testRunId,
    coapServerUrl: providedUrl
  }) {
    // Note: CoAP implementation may require additional setup
    // This is a simplified version that simulates CoAP behavior
    const metrics = {
      latency: [],
      jitter: [],
      reliability: 0,
      throughput: 0,
      ordering: 0,
      dataIntegrity: 0,
      resourceUsage: 0,
      securityOverhead: 0
    };

    // Allow CoAP server URL to be configured via parameter, environment variable, or use default
    const coapUrl =
      providedUrl ||
      process.env.COAP_SERVER_URL ||
      process.env.COAP_URL ||
      "coap://coap.me";

    if (testRunId) {
      const { Meteor } = require("meteor/meteor");
      Meteor.call("testLogs.add", testRunId, {
        type: "setup",
        message: `Initializing CoAP test (simulated) for server: ${coapUrl}`,
        protocol: "CoAP",
        url: coapUrl,
        note: "Current implementation uses simulation. Real CoAP server connection would require additional setup."
      });
    }

    // Simulated CoAP test (actual implementation would use coap library)
    const latencies = [];
    const startTime = Date.now();

    return new Promise((resolve) => {
      let sentCount = 0;
      let receivedCount = 0;

      const sendMessage = (index) => {
        if (index >= messageCount || Date.now() - startTime > duration) {
          // Calculate metrics
          if (latencies.length > 0) {
            metrics.latency =
              latencies.reduce((a, b) => a + b, 0) / latencies.length;
            const sortedLatencies = [...latencies].sort((a, b) => a - b);
            metrics.jitter =
              sortedLatencies[sortedLatencies.length - 1] - sortedLatencies[0];
          } else {
            metrics.latency = 0;
            metrics.jitter = 0;
          }

          metrics.reliability = (receivedCount / sentCount) * 100 || 0;
          metrics.throughput =
            (receivedCount * messageSize * 8) / (duration / 1000);
          metrics.ordering = receivedCount > 0 ? 90 : 0; // CoAP may have some ordering issues
          metrics.dataIntegrity = receivedCount > 0 ? 95 : 0;
          metrics.resourceUsage = 10; // Very low resource usage (IoT optimized)
          metrics.securityOverhead = 3; // Minimal if DTLS not used

          resolve(metrics);
          return;
        }

        sentCount++;
        const sendTime = Date.now();

        if (!networkSimulator.shouldDropPacket()) {
          const delay = networkSimulator.simulateDelay(20); // CoAP typically has lower latency
          networkSimulator.wait(delay).then(() => {
            // Simulate CoAP message exchange
            const receiveTime = Date.now() + delay + Math.random() * 50;
            const latency = receiveTime - sendTime;
            latencies.push(latency);
            receivedCount++;

            setTimeout(() => sendMessage(index + 1), 10);
          });
        } else {
          setTimeout(() => sendMessage(index + 1), 10);
        }
      };

      sendMessage(0);
    });
  }
}
