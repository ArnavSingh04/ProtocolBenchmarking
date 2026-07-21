// Deterministic protocol simulation.
//
// Produces physically-plausible metrics for each protocol/scenario combination
// without contacting any external service. Results are deterministic for a
// given (protocol, scenario) pair so demos and automated tests are repeatable.
//
// This is a MODEL, not a measurement — the UI and reports label it "Simulated"
// so results are never presented as real network measurements.

import { METRIC_KEYS } from "../shared/metrics";

// Per-protocol baseline characteristics, expressed relative to a stable
// low-latency network. Values are informed by the real-world trade-offs of each
// protocol (broker hop, header weight, transport, retransmission behaviour).
const PROFILES = {
  MQTT: {
    latencyFactor: 1.15, // adds a broker hop
    baseProcessingMs: 3,
    reliabilityBase: 99.5,
    lossResilience: 0.5, // QoS/retransmit recovers some loss
    throughputBase: 900_000, // bits/sec under ideal conditions
    orderingBase: 96,
    integrityBase: 99,
    resourceBase: 15,
    securityBase: 6
  },
  HTTP: {
    latencyFactor: 2.0, // full request/response round trip
    baseProcessingMs: 12, // header + connection overhead
    reliabilityBase: 99,
    lossResilience: 0.7, // TCP retransmission
    throughputBase: 600_000,
    orderingBase: 100,
    integrityBase: 100,
    resourceBase: 28,
    securityBase: 12
  },
  WEBSOCKET: {
    latencyFactor: 1.0, // persistent full-duplex channel
    baseProcessingMs: 2,
    reliabilityBase: 99.2,
    lossResilience: 0.7, // TCP
    throughputBase: 1_100_000,
    orderingBase: 99,
    integrityBase: 99,
    resourceBase: 22,
    securityBase: 8
  },
  COAP: {
    latencyFactor: 0.9, // lightweight UDP
    baseProcessingMs: 1.5,
    reliabilityBase: 97,
    lossResilience: 0.2, // UDP: limited recovery
    throughputBase: 400_000,
    orderingBase: 90,
    integrityBase: 96,
    resourceBase: 10,
    securityBase: 4
  }
};

// Scenario-level multipliers applied on top of the protocol baseline.
function scenarioModifiers(scenario) {
  const name = (scenario?.name || "").toLowerCase();
  const mods = {
    throughput: 1,
    resource: 1,
    security: 0,
    orderingPenalty: 0,
    extraLatency: 0
  };

  if (name.includes("high frequency")) {
    mods.throughput = 1.3;
    mods.resource = 1.5;
  } else if (name.includes("long duration")) {
    mods.throughput = 1.0;
    mods.resource = 1.1;
  } else if (name.includes("concurrent")) {
    mods.throughput = 0.7; // contention
    mods.resource = 1.6;
    mods.orderingPenalty = 2;
  } else if (name.includes("unstable")) {
    mods.throughput = 0.6;
    mods.resource = 1.2;
    mods.orderingPenalty = 5;
    mods.extraLatency = 15;
  } else if (name.includes("encrypted")) {
    mods.throughput = 0.9;
    mods.resource = 1.15;
    mods.security = 14; // TLS/DTLS handshake + per-message crypto
    mods.extraLatency = 5;
  }

  if (scenario?.encrypted) mods.security = Math.max(mods.security, 14);
  return mods;
}

// --- Deterministic pseudo-randomness -------------------------------------

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Simulate one protocol/scenario benchmark.
 * @returns {object} metrics with the same shape produced by the live testers.
 */
export function simulateBenchmark({ protocol, scenario, messageSize = 1024 }) {
  const key = String(protocol || "").toUpperCase();
  const profile = PROFILES[key] || PROFILES.HTTP;
  const scenarioName = scenario?.name || String(scenario) || "Stable Network";

  // Seeded jitter so each metric wiggles a little but reproducibly.
  const rand = mulberry32(hashString(`${key}|${scenarioName}|${messageSize}`));
  const noise = (spread) => 1 + (rand() - 0.5) * 2 * spread; // e.g. ±spread

  const netLatency = Number(scenario?.latency) || 10;
  const netJitter = Number(scenario?.jitter) || 2;
  const packetLoss = Number(scenario?.packetLoss) || 0;
  const unstable = Boolean(scenario?.unstable);
  const mods = scenarioModifiers(scenario);

  // Latency: network path × protocol factor + fixed processing + scenario add.
  const latency =
    (netLatency * profile.latencyFactor +
      profile.baseProcessingMs +
      mods.extraLatency) *
    noise(0.08);

  // Jitter: network jitter shaped by transport, plus a small protocol floor.
  const jitterTransport = key === "COAP" ? 1.1 : 0.85; // UDP more variable
  const jitter =
    (netJitter * jitterTransport +
      profile.baseProcessingMs * 0.2 +
      (unstable ? 12 : 0)) *
    noise(0.12);

  // Reliability: baseline reduced by the portion of loss the protocol cannot
  // recover, with an extra hit for unstable links.
  const effectiveLoss = packetLoss * (1 - profile.lossResilience) * 1.4;
  const reliability = clamp(
    (profile.reliabilityBase - effectiveLoss - (unstable ? 2 : 0)) * noise(0.01),
    0,
    100
  );

  // Throughput scales with reliability and the scenario load factor.
  const throughput = Math.max(
    0,
    profile.throughputBase * (reliability / 100) * mods.throughput * noise(0.06)
  );

  const ordering = clamp(
    profile.orderingBase - mods.orderingPenalty - packetLoss * 0.3,
    0,
    100
  );
  const dataIntegrity = clamp(
    profile.integrityBase - (key === "COAP" ? packetLoss * 0.4 : packetLoss * 0.1),
    0,
    100
  );
  const resourceUsage = clamp(
    Math.round(profile.resourceBase * mods.resource * noise(0.05)),
    0,
    100
  );
  const securityOverhead = clamp(
    Math.round((profile.securityBase + mods.security) * noise(0.05)),
    0,
    100
  );

  const metrics = {
    latency: Number(latency.toFixed(2)),
    jitter: Number(jitter.toFixed(2)),
    reliability: Number(reliability.toFixed(2)),
    throughput: Number(throughput.toFixed(0)),
    ordering,
    dataIntegrity,
    resourceUsage,
    securityOverhead,
    simulated: true
  };

  // Guard against any stray non-finite values.
  for (const metricKey of METRIC_KEYS) {
    if (!Number.isFinite(metrics[metricKey])) metrics[metricKey] = 0;
  }
  return metrics;
}
