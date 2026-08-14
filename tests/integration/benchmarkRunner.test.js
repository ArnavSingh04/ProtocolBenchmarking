import { describe, it, expect } from "vitest";
import { runBenchmark } from "../../lib/server/benchmarkRunner";
import { rankedProtocols } from "../../imports/shared/metrics";

const config = (overrides = {}) => ({
  testName: "Runner test",
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

async function collect(configuration) {
  const events = [];
  await runBenchmark(configuration, (event) => events.push(event), {
    testRunId: "runner-" + "abcdef123456"
  });
  return {
    events,
    results: events.filter((e) => e.type === "result").map((e) => e.payload),
    logs: events.filter((e) => e.type === "log").map((e) => e.payload),
    done: events.filter((e) => e.type === "done").pop()?.payload
  };
}

describe("runBenchmark (simulation)", () => {
  it("streams a result per protocol and finishes completed with scores", async () => {
    const { results, done } = await collect(config());

    expect(results).toHaveLength(3); // 3 protocols × 1 scenario
    expect(done.status).toBe("completed");
    expect(Object.keys(done.results)).toEqual(
      expect.arrayContaining(["MQTT", "HTTP", "WebSocket"])
    );

    const ranked = rankedProtocols(done.results);
    expect(ranked[0][1].failed).toBe(false);
  });

  it("streams one result per protocol × scenario", async () => {
    const { results } = await collect(
      config({
        selectedProtocols: ["MQTT", "HTTP"],
        scenarios: [{ name: "Stable Network" }, { name: "Unstable Network" }]
      })
    );
    expect(results).toHaveLength(4);
  });

  it("emits execution logs including completion entries", async () => {
    const { logs } = await collect(config());
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.type === "complete")).toBe(true);
    expect(logs.every((l) => typeof l.timestamp === "string")).toBe(true);
  });

  it("ends every run with exactly one terminal done event", async () => {
    const { events } = await collect(config());
    const dones = events.filter((e) => e.type === "done");
    expect(dones).toHaveLength(1);
    expect(events[events.length - 1].type).toBe("done");
  });

  it("excludes a failed protocol from ranking but still completes", async () => {
    const { done } = await collect(config({ failProtocols: ["HTTP"] }));
    expect(done.status).toBe("completed");
    expect(done.results.HTTP.failed).toBe(true);
    expect(done.results.HTTP.score).toBeNull();

    const ranked = rankedProtocols(done.results);
    expect(ranked[ranked.length - 1][0]).toBe("HTTP");
  });

  it("marks the run failed when every protocol fails", async () => {
    const { done } = await collect(
      config({ failProtocols: ["MQTT", "HTTP", "WebSocket"] })
    );
    expect(done.status).toBe("failed");
    expect(done.error).toBeTruthy();
  });

  it("does not throw for benchmark-level failure", async () => {
    await expect(
      runBenchmark(config({ failProtocols: ["MQTT", "HTTP", "WebSocket"] }), () => {})
    ).resolves.toBeUndefined();
  });
});
