import { describe, it, expect } from "vitest";
import {
  startRun,
  getRunById,
  getRunResults,
  getRunLogs,
  getHistory
} from "../../lib/server/runService";
import { rankedProtocols } from "../../imports/shared/metrics";

const config = (overrides = {}) => ({
  testName: "Integration run",
  attributes: [
    { name: "latency", weight: 40 },
    { name: "reliability", weight: 30 },
    { name: "throughput", weight: 30 }
  ],
  selectedProtocols: ["MQTT", "HTTP", "WebSocket"],
  scenarios: [{ name: "Stable Network", latency: 10, packetLoss: 0, jitter: 2 }],
  mode: "simulation",
  messageSize: 1024,
  messageFrequency: 100,
  fast: true,
  ...overrides
});

async function waitForRun(id, timeout = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const run = await getRunById(id);
    if (run && run.status !== "running") return run;
    await new Promise((r) => setTimeout(r, 15));
  }
  return getRunById(id);
}

describe("benchmark run lifecycle (simulation)", () => {
  it("runs to completion and produces scores for every protocol", async () => {
    const id = await startRun(config());
    expect(typeof id).toBe("string");

    const run = await waitForRun(id);
    expect(run.status).toBe("completed");
    expect(run.mode).toBe("simulation");
    expect(Object.keys(run.results)).toEqual(
      expect.arrayContaining(["MQTT", "HTTP", "WebSocket"])
    );

    const ranked = rankedProtocols(run.results);
    expect(ranked[0][1].failed).toBe(false);
    expect(ranked[0][1].score).toBeGreaterThanOrEqual(0);
  });

  it("persists one detailed result per protocol × scenario", async () => {
    const id = await startRun(
      config({
        selectedProtocols: ["MQTT", "HTTP"],
        scenarios: [{ name: "Stable Network" }, { name: "Unstable Network" }]
      })
    );
    await waitForRun(id);
    const results = await getRunResults(id);
    expect(results).toHaveLength(4); // 2 protocols × 2 scenarios
  });

  it("records execution logs", async () => {
    const id = await startRun(config());
    await waitForRun(id);
    const logs = await getRunLogs(id);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.type === "complete")).toBe(true);
  });

  it("appears in history", async () => {
    const id = await startRun(config({ testName: "History probe" }));
    await waitForRun(id);
    const history = await getHistory();
    expect(history.some((r) => r._id === id)).toBe(true);
  });

  it("excludes a failed protocol from ranking but still completes (partial failure)", async () => {
    const id = await startRun(config({ failProtocols: ["HTTP"] }));
    const run = await waitForRun(id);
    expect(run.status).toBe("completed");
    expect(run.results.HTTP.failed).toBe(true);
    expect(run.results.HTTP.score).toBeNull();

    const ranked = rankedProtocols(run.results);
    // Failed protocol must sort last and not be the winner.
    expect(ranked[0][0]).not.toBe("HTTP");
    expect(ranked[ranked.length - 1][0]).toBe("HTTP");
  });

  it("marks the run failed when every protocol fails", async () => {
    const id = await startRun(
      config({ failProtocols: ["MQTT", "HTTP", "WebSocket"] })
    );
    const run = await waitForRun(id);
    expect(run.status).toBe("failed");
    expect(run.error).toBeTruthy();
  });

  it("does not remain stuck in running state", async () => {
    const id = await startRun(config());
    const run = await waitForRun(id);
    expect(["completed", "failed"]).toContain(run.status);
    expect(run.endTime).toBeTruthy();
  });
});
