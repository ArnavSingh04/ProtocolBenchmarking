// Single source of truth for metric metadata, protocol/scenario metadata,
// value formatting, and the scoring / normalisation / ranking logic.
//
// This module is intentionally framework-agnostic (plain ES module) so it can
// be imported by the client bundle, the Next.js API layer, the benchmark
// engine, and the test suite without duplicating any logic.

/**
 * Metric definitions.
 *
 * `direction` describes what a "good" value looks like:
 *   - "lower"  → smaller values are better (latency, jitter, cost indices)
 *   - "higher" → larger values are better (reliability, throughput, ...)
 *
 * `scale` converts the raw stored value into the display value
 * (e.g. throughput is stored in bits/second and shown in kbps).
 */
export const METRICS = {
  latency: {
    key: "latency",
    label: "Latency",
    unit: "ms",
    direction: "lower",
    decimals: 1,
    scale: 1,
    description: "Average message round-trip delay."
  },
  jitter: {
    key: "jitter",
    label: "Jitter",
    unit: "ms",
    direction: "lower",
    decimals: 1,
    scale: 1,
    description: "Variation in latency across messages (max − min)."
  },
  reliability: {
    key: "reliability",
    label: "Reliability",
    unit: "%",
    direction: "higher",
    decimals: 1,
    scale: 1,
    description: "Share of messages delivered successfully."
  },
  throughput: {
    key: "throughput",
    label: "Throughput",
    unit: "kbps",
    direction: "higher",
    decimals: 1,
    scale: 0.001,
    description: "Sustained payload delivery rate."
  },
  ordering: {
    key: "ordering",
    label: "Ordering",
    unit: "%",
    direction: "higher",
    decimals: 0,
    scale: 1,
    description: "Preservation of message order on arrival."
  },
  dataIntegrity: {
    key: "dataIntegrity",
    label: "Data Integrity",
    unit: "%",
    direction: "higher",
    decimals: 0,
    scale: 1,
    description: "Delivery without corruption or loss of content."
  },
  resourceUsage: {
    key: "resourceUsage",
    label: "Resource Usage",
    unit: "idx",
    direction: "lower",
    decimals: 0,
    scale: 1,
    description: "Relative CPU / memory cost (lower is lighter)."
  },
  securityOverhead: {
    key: "securityOverhead",
    label: "Security Overhead",
    unit: "idx",
    direction: "lower",
    decimals: 0,
    scale: 1,
    description: "Relative cost of encryption / authentication (lower is cheaper)."
  }
};

export const METRIC_KEYS = Object.keys(METRICS);

export const LOWER_IS_BETTER = METRIC_KEYS.filter(
  (key) => METRICS[key].direction === "lower"
);

/** Quality attributes offered on the configuration screen. */
export const QUALITY_ATTRIBUTES = METRIC_KEYS.map((key) => ({
  name: key,
  label: METRICS[key].label,
  description: METRICS[key].description
}));

/** Protocol metadata, including the canonical colour used across all charts. */
export const PROTOCOLS = {
  MQTT: {
    id: "MQTT",
    name: "MQTT",
    color: "#2563eb",
    tagline: "Message Queuing Telemetry Transport — ideal for IoT",
    features: ["QoS levels", "Pub/Sub", "Lightweight"]
  },
  HTTP: {
    id: "HTTP",
    name: "HTTP",
    color: "#7c3aed",
    tagline: "Hypertext Transfer Protocol — the standard web protocol",
    features: ["Request/Response", "RESTful", "Universally supported"]
  },
  WebSocket: {
    id: "WebSocket",
    name: "WebSocket",
    color: "#0d9488",
    tagline: "Full-duplex channel — real-time web applications",
    features: ["Full-duplex", "Low latency", "Persistent connection"]
  },
  CoAP: {
    id: "CoAP",
    name: "CoAP",
    color: "#d97706",
    tagline: "Constrained Application Protocol — constrained devices",
    features: ["UDP-based", "Low overhead", "IoT optimised"]
  }
};

export const PROTOCOL_IDS = Object.keys(PROTOCOLS);

const FALLBACK_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#d97706", "#db2777"];

/** Resolve a protocol's canonical chart colour (case-insensitive). */
export function protocolColor(protocol, index = 0) {
  if (!protocol) return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  const match = PROTOCOL_IDS.find(
    (id) => id.toLowerCase() === String(protocol).toLowerCase()
  );
  return match
    ? PROTOCOLS[match].color
    : FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

/** Test scenarios (network / load conditions). */
export const SCENARIOS = [
  {
    name: "Stable Network",
    description: "Ideal conditions with consistent, low-latency connectivity.",
    latency: 10,
    packetLoss: 0,
    jitter: 2,
    unstable: false
  },
  {
    name: "Unstable Network",
    description: "Poor connectivity with frequent interruptions and spikes.",
    latency: 100,
    packetLoss: 5,
    jitter: 50,
    unstable: true
  },
  {
    name: "High Frequency",
    description: "Sustained high message frequency (1000+ messages/sec).",
    messageFrequency: 1000,
    duration: 10000,
    latency: 20,
    jitter: 5
  },
  {
    name: "Long Duration",
    description: "Extended session with steady sustained load.",
    duration: 60000,
    messageFrequency: 10,
    latency: 15,
    jitter: 4
  },
  {
    name: "Encrypted Connection",
    description: "TLS / DTLS enabled, adding security processing overhead.",
    latency: 30,
    jitter: 6,
    encrypted: true
  },
  {
    name: "Concurrent Load",
    description: "Many simultaneous client connections competing for resources.",
    concurrentClients: 10,
    latency: 25,
    packetLoss: 1,
    jitter: 10
  }
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/** Format a raw metric value for display, e.g. formatMetricValue("latency", 12.3) → "12.3 ms". */
export function formatMetricValue(key, value, { withUnit = true } = {}) {
  const meta = METRICS[key];
  if (!meta) return value == null ? "—" : String(value);
  if (!isFiniteNumber(value)) return "—";

  const scaled = value * meta.scale;
  const num = scaled.toFixed(meta.decimals);

  if (!withUnit || !meta.unit) return num;
  if (meta.unit === "%") return `${num}%`;
  if (meta.unit === "idx") return `${num}`;
  return `${num} ${meta.unit}`;
}

/** Short unit label suitable for a table header, e.g. "Latency (ms)". */
export function metricHeader(key) {
  const meta = METRICS[key];
  if (!meta) return key;
  if (!meta.unit || meta.unit === "idx") return meta.label;
  return `${meta.label} (${meta.unit})`;
}

/** Human-friendly duration from milliseconds. */
export function formatDuration(ms) {
  if (!isFiniteNumber(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

/** Duration between two ISO/Date/epoch values. */
export function durationBetween(start, end) {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return Math.max(0, endMs - startMs);
}

// ---------------------------------------------------------------------------
// Scoring / normalisation / ranking
// ---------------------------------------------------------------------------

/**
 * A protocol/scenario result is considered failed when the tester reported an
 * error, or when it produced no successful delivery at all. Failed results
 * must never be treated as strong performers (e.g. latency 0 looking "fast").
 */
export function isResultFailed(metrics) {
  if (!metrics || typeof metrics !== "object") return true;
  if (metrics.error) return true;
  const reliability = isFiniteNumber(metrics.reliability)
    ? metrics.reliability
    : 0;
  const throughput = isFiniteNumber(metrics.throughput)
    ? metrics.throughput
    : 0;
  const latency = isFiniteNumber(metrics.latency) ? metrics.latency : 0;
  return reliability === 0 && throughput === 0 && latency === 0;
}

/** Average the numeric metric keys across a list of metric objects. */
export function averageMetrics(metricsList) {
  const result = {};
  if (!Array.isArray(metricsList) || metricsList.length === 0) return result;

  for (const key of METRIC_KEYS) {
    const values = metricsList
      .map((m) => (m ? m[key] : undefined))
      .filter(isFiniteNumber);
    if (values.length > 0) {
      result[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  }
  return result;
}

/** Normalise a single metric value to a 0..1 score, respecting its direction. */
export function normalizeMetric(key, value, bounds) {
  const range = bounds && bounds[key];
  if (!range || range.max === range.min || !isFiniteNumber(value)) {
    return 0.5; // Neutral when there is nothing to compare against.
  }
  const fraction = (value - range.min) / (range.max - range.min);
  return LOWER_IS_BETTER.includes(key) ? 1 - fraction : fraction;
}

function recommendationFor(protocol, score, { failed, singleProtocol }) {
  if (failed) {
    return `${protocol} could not be evaluated in this run — the connection failed or returned no data, so it is excluded from the ranking.`;
  }
  if (singleProtocol) {
    return `${protocol} was tested on its own. Its raw metrics are shown below, but a fitness score is only meaningful when comparing two or more protocols.`;
  }
  if (score >= 80) {
    return `Excellent fit. ${protocol} leads on the attributes you weighted most heavily.`;
  }
  if (score >= 60) {
    return `Good fit. ${protocol} performs well overall with some trade-offs against the top choice.`;
  }
  if (score >= 40) {
    return `Moderate fit. ${protocol} is workable but is out-performed on your priorities.`;
  }
  return `Weak fit for these priorities. Another protocol aligns better with the attributes you weighted.`;
}

/**
 * Compute per-protocol fitness scores and metadata.
 *
 * @param {Array<{protocol:string, scenario:string, metrics:object}>} results
 * @param {Array<{name:string, weight:number}>} attributes
 * @returns {Object} keyed by protocol → { score, scorePrecise, metrics,
 *   recommendation, failed, partial, error, normalized }
 */
export function computeFitnessScores(results, attributes) {
  if (!Array.isArray(results) || results.length === 0) return {};
  const weights = Array.isArray(attributes) ? attributes : [];

  // Group raw results by protocol.
  const byProtocol = {};
  for (const result of results) {
    if (!result || !result.protocol) continue;
    if (!byProtocol[result.protocol]) byProtocol[result.protocol] = [];
    byProtocol[result.protocol].push(result.metrics || {});
  }

  // Summarise each protocol and determine failure status.
  const summaries = {};
  for (const [protocol, metricsList] of Object.entries(byProtocol)) {
    const succeeded = metricsList.filter((m) => !isResultFailed(m));
    const failed = succeeded.length === 0;
    const partial = !failed && succeeded.length < metricsList.length;
    const average = averageMetrics(failed ? metricsList : succeeded);
    const error = failed
      ? metricsList.find((m) => m && m.error)?.error || "No successful measurements"
      : null;
    summaries[protocol] = { average, failed, partial, error };
  }

  // Normalisation bounds are derived only from protocols that succeeded, so a
  // failed protocol's zeroed metrics cannot distort the comparison.
  const successfulProtocols = Object.keys(summaries).filter(
    (p) => !summaries[p].failed
  );
  const singleProtocol = successfulProtocols.length === 1;

  const bounds = {};
  for (const key of METRIC_KEYS) {
    const values = successfulProtocols
      .map((p) => summaries[p].average[key])
      .filter(isFiniteNumber);
    if (values.length > 0) {
      bounds[key] = { min: Math.min(...values), max: Math.max(...values) };
    }
  }

  const scores = {};
  for (const [protocol, summary] of Object.entries(summaries)) {
    if (summary.failed) {
      scores[protocol] = {
        score: null,
        scorePrecise: null,
        metrics: summary.average,
        normalized: {},
        failed: true,
        partial: false,
        error: summary.error,
        recommendation: recommendationFor(protocol, 0, { failed: true })
      };
      continue;
    }

    let weighted = 0;
    let totalWeight = 0;
    const normalized = {};

    for (const attr of weights) {
      const weight = isFiniteNumber(attr.weight) ? attr.weight : 0;
      if (weight <= 0) continue;
      const value = summary.average[attr.name];
      if (!isFiniteNumber(value)) continue; // metric genuinely absent
      const norm = normalizeMetric(attr.name, value, bounds);
      normalized[attr.name] = norm;
      weighted += norm * weight;
      totalWeight += weight;
    }

    const scorePrecise = totalWeight > 0 ? (weighted / totalWeight) * 100 : 0;

    scores[protocol] = {
      score: Math.round(scorePrecise),
      scorePrecise,
      metrics: summary.average,
      normalized,
      failed: false,
      partial: summary.partial,
      error: null,
      recommendation: recommendationFor(protocol, scorePrecise, {
        singleProtocol
      })
    };
  }

  return scores;
}

/**
 * Deterministic ranking of a scores object.
 * Failed protocols always sort last; ties break alphabetically for stability.
 */
export function rankedProtocols(scores) {
  if (!scores || typeof scores !== "object") return [];
  return Object.entries(scores).sort((a, b) => {
    const [nameA, dataA] = a;
    const [nameB, dataB] = b;
    if (dataA.failed !== dataB.failed) return dataA.failed ? 1 : -1;
    const scoreA = isFiniteNumber(dataA.scorePrecise)
      ? dataA.scorePrecise
      : isFiniteNumber(dataA.score)
        ? dataA.score
        : -1;
    const scoreB = isFiniteNumber(dataB.scorePrecise)
      ? dataB.scorePrecise
      : isFiniteNumber(dataB.score)
        ? dataB.score
        : -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return nameA.localeCompare(nameB);
  });
}

/** Convenience: number of protocols that produced usable data. */
export function countSuccessful(scores) {
  if (!scores) return 0;
  return Object.values(scores).filter((d) => d && !d.failed).length;
}

/**
 * Build a single, consistent comparison model for the charts and tables from
 * the detailed per-scenario results. Normalisation matches the scoring logic
 * (0..100, direction-aware, computed only over protocols that succeeded).
 */
export function buildProtocolComparison(results) {
  const empty = { protocols: [], scenarios: [], latencyByScenario: {} };
  if (!Array.isArray(results) || results.length === 0) return empty;

  const byProtocol = {};
  const scenarios = [];
  const latencyByScenario = {};

  for (const result of results) {
    if (!result || !result.protocol) continue;
    const proto = result.protocol;
    const scenario = result.scenario || "Scenario";
    if (!scenarios.includes(scenario)) scenarios.push(scenario);
    if (!byProtocol[proto]) byProtocol[proto] = [];
    byProtocol[proto].push(result.metrics || {});
    if (!latencyByScenario[proto]) latencyByScenario[proto] = {};
    const latency = result.metrics && result.metrics.latency;
    latencyByScenario[proto][scenario] = isFiniteNumber(latency)
      ? latency
      : null;
  }

  const summaries = Object.entries(byProtocol).map(([name, metricsList]) => {
    const succeeded = metricsList.filter((m) => !isResultFailed(m));
    const failed = succeeded.length === 0;
    const avg = averageMetrics(failed ? metricsList : succeeded);
    const error = failed
      ? metricsList.find((m) => m && m.error)?.error || "No data"
      : null;
    return { name, failed, error, avg };
  });

  const successful = summaries.filter((s) => !s.failed);
  const bounds = {};
  for (const key of METRIC_KEYS) {
    const values = successful.map((s) => s.avg[key]).filter(isFiniteNumber);
    if (values.length > 0) {
      bounds[key] = { min: Math.min(...values), max: Math.max(...values) };
    }
  }

  const protocols = summaries.map((s, index) => {
    const normalized = {};
    for (const key of METRIC_KEYS) {
      if (s.failed || !isFiniteNumber(s.avg[key])) {
        normalized[key] = s.failed ? 0 : null;
      } else {
        normalized[key] = Math.round(normalizeMetric(key, s.avg[key], bounds) * 100);
      }
    }
    return {
      name: s.name,
      color: protocolColor(s.name, index),
      failed: s.failed,
      error: s.error,
      metrics: s.avg,
      normalized
    };
  });

  return { protocols, scenarios, latencyByScenario };
}
