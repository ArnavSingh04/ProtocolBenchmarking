import { describe, it, expect } from "vitest";
import { simulateBenchmark } from "../../imports/test-engine/simulation";
import { METRIC_KEYS, SCENARIOS } from "../../imports/shared/metrics";

const stable = SCENARIOS.find((s) => s.name === "Stable Network");
const unstable = SCENARIOS.find((s) => s.name === "Unstable Network");
const encrypted = SCENARIOS.find((s) => s.name === "Encrypted Connection");

describe("simulateBenchmark", () => {
  it("is deterministic for the same inputs", () => {
    const a = simulateBenchmark({ protocol: "MQTT", scenario: stable });
    const b = simulateBenchmark({ protocol: "MQTT", scenario: stable });
    expect(a).toEqual(b);
  });

  it("produces only finite metric values", () => {
    for (const protocol of ["MQTT", "HTTP", "WebSocket", "CoAP"]) {
      for (const scenario of SCENARIOS) {
        const m = simulateBenchmark({ protocol, scenario });
        for (const key of METRIC_KEYS) {
          expect(Number.isFinite(m[key]), `${protocol}/${scenario.name}/${key}`).toBe(
            true
          );
        }
        expect(m.simulated).toBe(true);
      }
    }
  });

  it("models MQTT with lower latency than HTTP on a stable network", () => {
    const mqtt = simulateBenchmark({ protocol: "MQTT", scenario: stable });
    const http = simulateBenchmark({ protocol: "HTTP", scenario: stable });
    expect(mqtt.latency).toBeLessThan(http.latency);
  });

  it("reduces reliability under packet loss", () => {
    const good = simulateBenchmark({ protocol: "MQTT", scenario: stable });
    const bad = simulateBenchmark({ protocol: "MQTT", scenario: unstable });
    expect(bad.reliability).toBeLessThan(good.reliability);
  });

  it("raises security overhead for an encrypted scenario", () => {
    const plain = simulateBenchmark({ protocol: "HTTP", scenario: stable });
    const secure = simulateBenchmark({ protocol: "HTTP", scenario: encrypted });
    expect(secure.securityOverhead).toBeGreaterThan(plain.securityOverhead);
  });

  it("keeps reliability within 0-100", () => {
    const m = simulateBenchmark({ protocol: "CoAP", scenario: unstable });
    expect(m.reliability).toBeGreaterThanOrEqual(0);
    expect(m.reliability).toBeLessThanOrEqual(100);
  });
});
