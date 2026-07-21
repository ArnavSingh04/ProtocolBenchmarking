import { describe, it, expect } from "vitest";
import { buildReport, reportFileName, sanitizeFileName } from "../../imports/shared/report";
import { buildProtocolComparison } from "../../imports/shared/metrics";

const testRun = {
  _id: "run-abc12345",
  status: "completed",
  mode: "simulation",
  startTime: "2026-07-21T10:00:00.000Z",
  endTime: "2026-07-21T10:00:03.000Z",
  protocols: ["MQTT", "HTTP"],
  scenarios: [{ name: "Stable Network" }],
  attributes: [
    { name: "latency", label: "Latency", weight: 60 },
    { name: "reliability", label: "Reliability", weight: 40 }
  ],
  configuration: {
    testName: "My Report Test",
    // Secret-ish endpoint config that must NOT appear in the report.
    protocolConfig: { httpEndpoint: "https://secret.internal/webhook" }
  },
  results: {
    MQTT: { score: 88, scorePrecise: 88, failed: false, metrics: { latency: 12, reliability: 99.5, throughput: 900000 }, recommendation: "Excellent." },
    HTTP: { score: null, failed: true, error: "timeout", metrics: {}, recommendation: "Failed." }
  }
};

const detailed = [
  { protocol: "MQTT", scenario: "Stable Network", metrics: { latency: 12, reliability: 99.5, throughput: 900000 } },
  { protocol: "HTTP", scenario: "Stable Network", metrics: { latency: 0, reliability: 0, throughput: 0, error: "timeout" } }
];

describe("buildReport", () => {
  const report = buildReport(testRun, detailed, { generatedAt: "2026-07-21T10:00:05.000Z" });

  it("captures test metadata and duration", () => {
    expect(report.test.name).toBe("My Report Test");
    expect(report.test.durationMs).toBe(3000);
    expect(report.test.protocols).toEqual(["MQTT", "HTTP"]);
    expect(report.test.scenarios).toEqual(["Stable Network"]);
  });

  it("labels the mode honestly", () => {
    expect(report.meta.mode).toBe("simulation");
    expect(report.meta.resultsAreModelled).toBe(true);
  });

  it("ranks successful protocols and excludes failed ones from rank", () => {
    const mqtt = report.ranking.find((r) => r.protocol === "MQTT");
    const http = report.ranking.find((r) => r.protocol === "HTTP");
    expect(mqtt.rank).toBe(1);
    expect(mqtt.fitnessScore).toBe(88);
    expect(http.rank).toBeNull();
    expect(http.failed).toBe(true);
  });

  it("includes metric values with units and display strings", () => {
    const mqtt = report.metrics.find((m) => m.protocol === "MQTT");
    expect(mqtt.metrics.latency.unit).toBe("ms");
    expect(mqtt.metrics.latency.display).toBe("12.0 ms");
    expect(mqtt.metrics.throughput.display).toBe("900.0 kbps");
  });

  it("never leaks endpoint configuration / secrets", () => {
    expect(JSON.stringify(report)).not.toContain("secret.internal");
    expect(JSON.stringify(report)).not.toContain("protocolConfig");
  });
});

describe("reportFileName / sanitizeFileName", () => {
  it("builds a professional, safe filename", () => {
    expect(reportFileName(testRun, "2026-07-21T10:00:05Z")).toBe(
      "protocol-benchmark-my-report-test-2026-07-21.json"
    );
  });
  it("falls back for empty names", () => {
    expect(sanitizeFileName("")).toBe("benchmark");
    expect(sanitizeFileName("  !!!  ")).toBe("benchmark");
  });
});

describe("buildProtocolComparison", () => {
  const comparison = buildProtocolComparison(detailed);

  it("groups, averages and normalises to 0-100 over successful protocols", () => {
    const mqtt = comparison.protocols.find((p) => p.name === "MQTT");
    expect(mqtt.failed).toBe(false);
    // Only one successful protocol → neutral 50 normalisation.
    expect(mqtt.normalized.latency).toBe(50);
    expect(mqtt.metrics.latency).toBe(12);
  });

  it("marks failed protocols and lists scenarios", () => {
    const http = comparison.protocols.find((p) => p.name === "HTTP");
    expect(http.failed).toBe(true);
    expect(comparison.scenarios).toEqual(["Stable Network"]);
    expect(comparison.latencyByScenario.MQTT["Stable Network"]).toBe(12);
  });
});
