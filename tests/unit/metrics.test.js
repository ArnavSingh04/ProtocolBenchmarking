import { describe, it, expect } from "vitest";
import {
  formatMetricValue,
  metricHeader,
  formatDuration,
  durationBetween,
  isResultFailed,
  averageMetrics,
  normalizeMetric,
  computeFitnessScores,
  rankedProtocols,
  countSuccessful,
  protocolColor,
  PROTOCOLS
} from "../../imports/shared/metrics";

describe("formatMetricValue", () => {
  it("formats latency with unit and decimals", () => {
    expect(formatMetricValue("latency", 12.34)).toBe("12.3 ms");
  });
  it("scales throughput from bps to kbps", () => {
    expect(formatMetricValue("throughput", 900000)).toBe("900.0 kbps");
  });
  it("renders percentages without a space", () => {
    expect(formatMetricValue("reliability", 99.5)).toBe("99.5%");
  });
  it("returns an em dash for non-finite values", () => {
    expect(formatMetricValue("latency", NaN)).toBe("—");
    expect(formatMetricValue("latency", Infinity)).toBe("—");
    expect(formatMetricValue("latency", null)).toBe("—");
  });
  it("can omit the unit", () => {
    expect(formatMetricValue("latency", 10, { withUnit: false })).toBe("10.0");
  });
});

describe("metricHeader", () => {
  it("includes the unit", () => {
    expect(metricHeader("latency")).toBe("Latency (ms)");
  });
  it("omits index units", () => {
    expect(metricHeader("resourceUsage")).toBe("Resource Usage");
  });
});

describe("formatDuration", () => {
  it("formats milliseconds", () => {
    expect(formatDuration(500)).toBe("500 ms");
  });
  it("formats seconds", () => {
    expect(formatDuration(4500)).toBe("4.5 s");
  });
  it("formats minutes", () => {
    expect(formatDuration(65000)).toBe("1m 5s");
  });
  it("guards against bad input", () => {
    expect(formatDuration(-1)).toBe("—");
    expect(formatDuration(NaN)).toBe("—");
  });
});

describe("durationBetween", () => {
  it("computes elapsed ms", () => {
    expect(
      durationBetween("2024-01-01T00:00:00Z", "2024-01-01T00:00:05Z")
    ).toBe(5000);
  });
  it("returns null for missing values", () => {
    expect(durationBetween(null, new Date())).toBeNull();
  });
});

describe("isResultFailed", () => {
  it("flags an explicit error", () => {
    expect(isResultFailed({ error: "boom", reliability: 50 })).toBe(true);
  });
  it("flags all-zero output", () => {
    expect(
      isResultFailed({ latency: 0, reliability: 0, throughput: 0 })
    ).toBe(true);
  });
  it("accepts a successful measurement", () => {
    expect(isResultFailed({ latency: 12, reliability: 99, throughput: 1000 })).toBe(
      false
    );
  });
});

describe("averageMetrics", () => {
  it("averages numeric keys and ignores non-numbers", () => {
    const avg = averageMetrics([
      { latency: 10, reliability: 100, error: "x" },
      { latency: 20, reliability: 90 }
    ]);
    expect(avg.latency).toBe(15);
    expect(avg.reliability).toBe(95);
    expect(avg.error).toBeUndefined();
  });
});

describe("normalizeMetric", () => {
  const bounds = { latency: { min: 10, max: 30 }, reliability: { min: 80, max: 100 } };
  it("inverts lower-is-better metrics", () => {
    expect(normalizeMetric("latency", 10, bounds)).toBe(1); // fastest → best
    expect(normalizeMetric("latency", 30, bounds)).toBe(0); // slowest → worst
  });
  it("keeps higher-is-better metrics as-is", () => {
    expect(normalizeMetric("reliability", 100, bounds)).toBe(1);
    expect(normalizeMetric("reliability", 80, bounds)).toBe(0);
  });
  it("returns neutral 0.5 when there is nothing to compare", () => {
    expect(normalizeMetric("latency", 10, { latency: { min: 10, max: 10 } })).toBe(
      0.5
    );
  });
});

const attrs = (overrides = {}) => [
  { name: "latency", weight: 50 },
  { name: "reliability", weight: 50 },
  ...Object.entries(overrides).map(([name, weight]) => ({ name, weight }))
];

describe("computeFitnessScores", () => {
  it("ranks the protocol that is better on weighted attributes higher", () => {
    const results = [
      { protocol: "MQTT", scenario: "s", metrics: { latency: 10, reliability: 99, throughput: 1000 } },
      { protocol: "HTTP", scenario: "s", metrics: { latency: 40, reliability: 90, throughput: 1000 } }
    ];
    const scores = computeFitnessScores(results, attrs());
    expect(scores.MQTT.score).toBeGreaterThan(scores.HTTP.score);
    expect(scores.MQTT.failed).toBe(false);
  });

  it("does NOT count a 0-weight = irrelevant attribute, and DOES count 0-valued metrics", () => {
    // jitter of 0 must be treated as a real (excellent) value, not skipped.
    const results = [
      { protocol: "A", scenario: "s", metrics: { latency: 10, reliability: 90, jitter: 0, throughput: 100 } },
      { protocol: "B", scenario: "s", metrics: { latency: 10, reliability: 90, jitter: 50, throughput: 100 } }
    ];
    const scores = computeFitnessScores(results, [{ name: "jitter", weight: 100 }]);
    // A has zero jitter (best) → should decisively out-score B.
    expect(scores.A.score).toBe(100);
    expect(scores.B.score).toBe(0);
  });

  it("excludes failed protocols from ranking and does not let latency 0 win", () => {
    const results = [
      { protocol: "GOOD", scenario: "s", metrics: { latency: 25, reliability: 99, throughput: 1000 } },
      { protocol: "DEAD", scenario: "s", metrics: { latency: 0, reliability: 0, throughput: 0, error: "timeout" } }
    ];
    const scores = computeFitnessScores(results, attrs());
    expect(scores.DEAD.failed).toBe(true);
    expect(scores.DEAD.score).toBeNull();
    // GOOD is the only successful protocol; it must not be beaten by DEAD.
    const ranked = rankedProtocols(scores);
    expect(ranked[0][0]).toBe("GOOD");
    expect(ranked[ranked.length - 1][0]).toBe("DEAD");
  });

  it("marks a single successful protocol and still returns its metrics", () => {
    const results = [
      { protocol: "ONLY", scenario: "s", metrics: { latency: 10, reliability: 99, throughput: 1000 } }
    ];
    const scores = computeFitnessScores(results, attrs());
    expect(countSuccessful(scores)).toBe(1);
    expect(scores.ONLY.recommendation).toMatch(/on its own|comparing/i);
  });

  it("returns empty object for no results", () => {
    expect(computeFitnessScores([], attrs())).toEqual({});
  });
});

describe("rankedProtocols", () => {
  it("is deterministic and breaks ties alphabetically", () => {
    const scores = {
      Zeta: { score: 50, scorePrecise: 50, failed: false },
      Alpha: { score: 50, scorePrecise: 50, failed: false }
    };
    const ranked = rankedProtocols(scores).map(([name]) => name);
    expect(ranked).toEqual(["Alpha", "Zeta"]);
  });
});

describe("protocolColor", () => {
  it("returns the canonical colour case-insensitively", () => {
    expect(protocolColor("mqtt")).toBe(PROTOCOLS.MQTT.color);
    expect(protocolColor("WebSocket")).toBe(PROTOCOLS.WebSocket.color);
  });
  it("falls back for unknown protocols", () => {
    expect(protocolColor("XYZ", 0)).toMatch(/^#/);
  });
});
