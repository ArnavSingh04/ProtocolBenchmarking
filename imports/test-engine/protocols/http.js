// Chatgpt by openAI was used to assist in the writing the code for the following file
export class HTTPTester {
  async runBenchmark({
    messageCount,
    messageSize,
    duration,
    networkSimulator,
    testRunId,
    httpEndpoint: providedEndpoint
  }) {
    // Import axios - handle both default and named export shapes.
    let axios;
    try {
      const axiosModule = require("axios");
      axios = axiosModule.default || axiosModule;
      if (!axios || typeof axios.post !== "function") {
        throw new Error("axios.post is unavailable");
      }
    } catch (error) {
      throw new Error(`Failed to load axios HTTP client: ${error.message}`);
    }

    const metrics = {
      latency: 0,
      jitter: 0,
      reliability: 0,
      throughput: 0,
      ordering: 0,
      dataIntegrity: 0,
      resourceUsage: 0,
      securityOverhead: 0
    };

    const latencies = [];
    let successCount = 0;
    let totalCount = 0;
    // Holds the most recent request failure so we can surface a real reason
    // (rather than a generic "No data returned") when nothing succeeds.
    let lastError = null;
    const startTime = Date.now();

    // Test endpoint - allow configuration via parameter, environment variable, or use default.
    // Default is postman-echo (stable, accepts any POST) rather than httpbin.org,
    // which is frequently rate-limited/down and often blocked by prod egress rules.
    const testUrl =
      providedEndpoint ||
      process.env.HTTP_TEST_URL ||
      process.env.HTTP_ENDPOINT ||
      "https://postman-echo.com/post";

    return new Promise((resolve) => {
      let testEnded = false;

      const sendRequest = async (index) => {
        // Check if we should stop
        if (index >= messageCount || Date.now() - startTime > duration) {
          // Calculate final metrics
          if (latencies.length > 0) {
            metrics.latency =
              latencies.reduce((a, b) => a + b, 0) / latencies.length;
            const sortedLatencies = [...latencies].sort((a, b) => a - b);
            metrics.jitter =
              sortedLatencies.length > 1
                ? sortedLatencies[sortedLatencies.length - 1] -
                  sortedLatencies[0]
                : 0;
          } else {
            metrics.latency = 0;
            metrics.jitter = 0;
          }

          const actualDuration = (Date.now() - startTime) / 1000; // in seconds
          metrics.reliability =
            totalCount > 0 ? (successCount / totalCount) * 100 : 0;
          metrics.throughput =
            actualDuration > 0 && successCount > 0
              ? (successCount * messageSize * 8) / actualDuration
              : 0; // bits per second

          // Log summary
          if (testRunId) {
            const { Meteor } = require("meteor/meteor");
            Meteor.call("testLogs.add", testRunId, {
              type: "calculate",
              message: `HTTP Summary: Sent ${totalCount}, Success ${successCount}, Latency samples ${latencies.length}`,
              protocol: "HTTP",
              sentCount: totalCount,
              receivedCount: successCount,
              latencySamples: latencies.length
            });
          }
          metrics.ordering = 100; // HTTP maintains ordering
          metrics.dataIntegrity = successCount > 0 ? 100 : 0;
          metrics.resourceUsage = 25; // Moderate resource usage
          metrics.securityOverhead = 10; // TLS overhead if HTTPS

          // If not a single request succeeded, attach the last failure so the
          // UI shows the real cause (e.g. ETIMEDOUT, ENOTFOUND, HTTP 503)
          // instead of the generic "No data returned" fallback.
          if (successCount === 0) {
            if (lastError) {
              const code = lastError.code ? ` (${lastError.code})` : "";
              const status = lastError.response
                ? ` [HTTP ${lastError.response.status}]`
                : "";
              metrics.error = `All ${totalCount} HTTP request(s) to ${testUrl} failed: ${lastError.message}${code}${status}`;
            } else if (totalCount > 0) {
              metrics.error = `All ${totalCount} HTTP request(s) to ${testUrl} returned a non-success status`;
            } else {
              metrics.error = `No HTTP requests were sent to ${testUrl} (test window elapsed before any request)`;
            }
          }

          if (testRunId) {
            const { Meteor } = require("meteor/meteor");
            Meteor.call("testLogs.add", testRunId, {
              type: "complete",
              message: `HTTP test completed. Sent: ${totalCount}, Success: ${successCount}`,
              protocol: "HTTP",
              metrics,
              sentCount: totalCount,
              receivedCount: successCount
            });
          }

          testEnded = true;
          resolve(metrics);
          return;
        }

        totalCount++;
        const requestStart = Date.now();

        if (!networkSimulator.shouldDropPacket()) {
          const delay = networkSimulator.simulateDelay(0);
          await networkSimulator.wait(delay);

          try {
            const payload = "a".repeat(messageSize);

            // Bound the per-request timeout to whatever remains of the scenario
            // window (capped at 15s). Without this a single slow request could
            // exceed `duration`, leaving the run with zero successes and no
            // useful signal about why.
            const remaining = duration - (Date.now() - startTime);
            const requestTimeout = Math.min(15000, Math.max(1000, remaining));

            // POST the payload as a raw string. No explicit Content-Type so the
            // endpoint can accept any format; validateStatus lets us inspect
            // non-2xx responses instead of throwing on them.
            const response = await axios.post(
              testUrl,
              payload, // Raw string payload
              {
                timeout: requestTimeout,
                validateStatus: () => true, // Accept any status code for logging
                maxRedirects: 5
              }
            );

            // Log first request details for debugging
            if (totalCount === 1 && testRunId) {
              const { Meteor } = require("meteor/meteor");
              Meteor.call("testLogs.add", testRunId, {
                type: "send",
                message: `HTTP request #1: Status ${
                  response.status
                }, URL: ${testUrl.substring(0, 50)}...`,
                protocol: "HTTP",
                statusCode: response.status,
                statusText: response.statusText,
                headers: response.headers ? Object.keys(response.headers) : []
              });
            }

            // Accept any 2xx status code as success (200, 201, 202, 204, etc.)
            // Also accept 3xx redirects as they might be followed
            if (response.status >= 200 && response.status < 300) {
              const requestLatency = Date.now() - requestStart;
              latencies.push(requestLatency);
              successCount++;

              // Log progress periodically or for first few requests
              if (testRunId && (successCount <= 3 || successCount % 10 === 0)) {
                const { Meteor } = require("meteor/meteor");
                Meteor.call("testLogs.add", testRunId, {
                  type: "receive",
                  message: `HTTP: ${successCount} successful requests (status ${
                    response.status
                  }), avg latency: ${(
                    latencies.reduce((a, b) => a + b, 0) / latencies.length
                  ).toFixed(2)}ms`,
                  protocol: "HTTP",
                  receivedCount: successCount,
                  avgLatency:
                    latencies.reduce((a, b) => a + b, 0) / latencies.length,
                  statusCode: response.status
                });
              }
            } else {
              // Remember the last non-success status so it can be surfaced if
              // the whole run ends up with zero successful requests.
              lastError = {
                message: `Non-success status ${response.status}`,
                response: { status: response.status }
              };
              // Log non-2xx status codes - always log first few for debugging
              if (testRunId && (totalCount <= 3 || totalCount % 10 === 0)) {
                const { Meteor } = require("meteor/meteor");
                Meteor.call("testLogs.add", testRunId, {
                  type: "send",
                  message: `HTTP request returned status ${response.status} (not 2xx)`,
                  protocol: "HTTP",
                  statusCode: response.status,
                  statusText: response.statusText
                });
              }
            }
          } catch (error) {
            // Remember the failure so it can be surfaced if the whole run ends
            // up with zero successful requests.
            lastError = error;
            // Request failed - always log first few errors for debugging
            const shouldLog = totalCount <= 3 || totalCount % 10 === 0;
            if (testRunId && shouldLog) {
              const { Meteor } = require("meteor/meteor");
              const errorDetails = {
                message: error.message,
                code: error.code,
                response: error.response
                  ? {
                      status: error.response.status,
                      statusText: error.response.statusText,
                      data:
                        typeof error.response.data === "string"
                          ? error.response.data.substring(0, 100)
                          : error.response.data
                    }
                  : null
              };

              Meteor.call("testLogs.add", testRunId, {
                type: "send",
                message: `HTTP request error: ${error.message}${
                  error.code ? ` (${error.code})` : ""
                }`,
                protocol: "HTTP",
                error: errorDetails
              });
            }

            // Also log to console for debugging
            console.error(
              `[HTTP] Request ${totalCount} failed:`,
              error.message,
              error.code
            );
          }
        } else {
          // Packet was dropped - still count it
          if (testRunId && totalCount % 10 === 0) {
            const { Meteor } = require("meteor/meteor");
            Meteor.call("testLogs.add", testRunId, {
              type: "send",
              message: `Packet dropped (simulated network condition)`,
              protocol: "HTTP"
            });
          }
        }

        // Continue with next request - use a small delay to allow async operations to complete
        if (!testEnded) {
          setTimeout(() => {
            sendRequest(index + 1).catch((err) => {
              console.error(
                `[HTTP] Error in sendRequest for index ${index + 1}:`,
                err
              );
              // Continue anyway to not block the test - errors in one request shouldn't stop others
              if (!testEnded) {
                setTimeout(() => sendRequest(index + 1), 100);
              }
            });
          }, 10);
        }
      };

      if (testRunId) {
        const { Meteor } = require("meteor/meteor");
        Meteor.call("testLogs.add", testRunId, {
          type: "setup",
          message: `Starting HTTP test to ${testUrl}`,
          protocol: "HTTP",
          url: testUrl,
          messageCount,
          messageSize,
          duration
        });
      }

      // Start sending requests
      sendRequest(0);
    });
  }
}
