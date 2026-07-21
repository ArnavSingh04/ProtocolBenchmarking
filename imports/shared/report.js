// Builds the downloadable benchmark report. Pure and deterministic (the caller
// stamps `generatedAt`) so it can be unit-tested. Deliberately excludes
// endpoint URLs and any other configuration secrets.

import {
  METRICS,
  METRIC_KEYS,
  rankedProtocols,
  durationBetween,
  formatMetricValue
} from "./metrics";

export function sanitizeFileName(name) {
  return (name || "benchmark")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "benchmark";
}

export function reportFileName(testRun, isoDate) {
  const name = sanitizeFileName(testRun?.configuration?.testName);
  const date = (isoDate || "").slice(0, 10) || "report";
  return `protocol-benchmark-${name}-${date}.json`;
}

export function buildReport(testRun, detailedResults = [], meta = {}) {
  if (!testRun) return null;

  const mode = testRun.mode || testRun.configuration?.mode || "simulation";
  const scores = testRun.results || {};
  const ranked = rankedProtocols(scores);
  const attributes = testRun.attributes || testRun.configuration?.attributes || [];

  const ranking = ranked.map(([protocol, data], index) => ({
    rank: data.failed ? null : index + 1,
    protocol,
    fitnessScore: data.failed ? null : data.score,
    failed: Boolean(data.failed),
    error: data.error || null,
    recommendation: data.recommendation || null
  }));

  const buildMetricValues = (metrics = {}) => {
    const values = {};
    for (const key of METRIC_KEYS) {
      const raw = metrics[key];
      values[key] = {
        label: METRICS[key].label,
        value: typeof raw === "number" ? raw : null,
        unit: METRICS[key].unit,
        direction: METRICS[key].direction,
        display: formatMetricValue(key, raw)
      };
    }
    return values;
  };

  const perProtocolMetrics = Object.entries(scores).map(([protocol, data]) => ({
    protocol,
    failed: Boolean(data.failed),
    error: data.error || null,
    metrics: buildMetricValues(data.metrics)
  }));

  return {
    meta: {
      tool: "ProtocolBench",
      generatedAt: meta.generatedAt || null,
      mode,
      resultsAreModelled: mode !== "live",
      note:
        mode === "live"
          ? "Results were measured against live endpoints and depend on network conditions."
          : "Results were produced by a deterministic simulation model, not live network measurements."
    },
    test: {
      id: testRun._id,
      name: testRun.configuration?.testName || "Untitled Test",
      status: testRun.status,
      startTime: testRun.startTime || null,
      endTime: testRun.endTime || null,
      durationMs: durationBetween(testRun.startTime, testRun.endTime),
      protocols: testRun.protocols || [],
      scenarios: (testRun.scenarios || []).map((s) => s?.name || s)
    },
    weights: attributes.map((a) => ({
      attribute: a.name,
      label: a.label,
      weight: a.weight
    })),
    ranking,
    metrics: perProtocolMetrics,
    detailedResults: (detailedResults || []).map((r) => ({
      protocol: r.protocol,
      scenario: r.scenario,
      metrics: r.metrics
    }))
  };
}
