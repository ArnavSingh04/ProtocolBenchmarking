// Shared configuration validation, used by the client form (live feedback) and
// enforced again at the API boundary so the server never trusts the client.

import { PROTOCOL_IDS, METRIC_KEYS } from "./metrics";

export const WEIGHT_TOTAL = 100;
export const WEIGHT_TOLERANCE = 0.5; // absorb float rounding on 0.1 steps
export const MAX_TEST_NAME_LENGTH = 120;

const RUN_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;

/** Accept only well-formed run identifiers as route parameters. */
export function isValidRunId(value) {
  return typeof value === "string" && RUN_ID_RE.test(value);
}

const URL_SCHEMES = {
  mqttBrokerUrl: ["mqtt:", "mqtts:", "tcp:", "ws:", "wss:"],
  httpEndpoint: ["http:", "https:"],
  websocketUrl: ["ws:", "wss:"],
  coapServerUrl: ["coap:", "coaps:"]
};

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function schemeOf(url) {
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*:)/.exec(String(url).trim());
  return match ? match[1].toLowerCase() : null;
}

/** True when the weights sum close enough to 100 to be considered valid. */
export function isWeightTotalValid(total) {
  return Math.abs(total - WEIGHT_TOTAL) <= WEIGHT_TOLERANCE;
}

export function sumWeights(attributes) {
  if (!Array.isArray(attributes)) return 0;
  return attributes.reduce((sum, attr) => {
    const weight = Number(attr?.weight);
    return sum + (Number.isFinite(weight) ? weight : 0);
  }, 0);
}

/**
 * Validate (and normalise) a benchmark configuration.
 * @returns {{ valid: boolean, errors: Object<string,string>, normalized: object|null }}
 */
export function validateConfiguration(rawConfig) {
  const errors = {};
  const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};

  // --- Protocols ---
  const selectedProtocols = Array.isArray(config.selectedProtocols)
    ? config.selectedProtocols
    : [];
  const validProtocols = selectedProtocols.filter((p) =>
    PROTOCOL_IDS.includes(p)
  );
  if (validProtocols.length === 0) {
    errors.protocols = "Select at least one protocol to compare.";
  }

  // --- Scenarios ---
  const scenarios = Array.isArray(config.scenarios) ? config.scenarios : [];
  const validScenarios = scenarios.filter(
    (s) => s && (isNonEmptyString(s.name) || isNonEmptyString(s))
  );
  if (validScenarios.length === 0) {
    errors.scenarios = "Select at least one test scenario.";
  }

  // --- Attributes / weights ---
  const attributes = Array.isArray(config.attributes) ? config.attributes : [];
  const normalizedAttributes = attributes
    .filter((attr) => attr && METRIC_KEYS.includes(attr.name))
    .map((attr) => {
      const weight = Number(attr.weight);
      return {
        ...attr,
        weight: Number.isFinite(weight) ? Math.max(0, Math.min(100, weight)) : 0
      };
    });

  if (normalizedAttributes.length === 0) {
    errors.attributes = "Quality attributes are missing or invalid.";
  } else {
    const total = sumWeights(normalizedAttributes);
    if (!isWeightTotalValid(total)) {
      errors.weights = `Attribute weights must total ${WEIGHT_TOTAL}% (currently ${total.toFixed(
        1
      )}%).`;
    } else if (total === 0) {
      errors.weights = "At least one attribute must have a non-zero weight.";
    }
  }

  // --- Mode ---
  const mode = config.mode === "live" ? "live" : "simulation";

  // --- Test name ---
  let testName = typeof config.testName === "string" ? config.testName.trim() : "";
  if (testName.length > MAX_TEST_NAME_LENGTH) {
    errors.testName = `Test name must be ${MAX_TEST_NAME_LENGTH} characters or fewer.`;
    testName = testName.slice(0, MAX_TEST_NAME_LENGTH);
  }

  // --- Protocol endpoint config (only meaningful in live mode) ---
  const rawProtocolConfig =
    config.protocolConfig && typeof config.protocolConfig === "object"
      ? config.protocolConfig
      : {};
  const protocolConfig = {};
  for (const [field, schemes] of Object.entries(URL_SCHEMES)) {
    const value = rawProtocolConfig[field];
    if (isNonEmptyString(value)) {
      const trimmed = value.trim();
      if (mode === "live") {
        const scheme = schemeOf(trimmed);
        if (!scheme || !schemes.includes(scheme)) {
          errors[field] = `Expected a URL starting with ${schemes
            .map((s) => `${s}//`)
            .join(" or ")}`;
        }
      }
      protocolConfig[field] = trimmed;
    }
  }

  const valid = Object.keys(errors).length === 0;

  const normalized = valid
    ? {
        testName: testName || `Test ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
        attributes: normalizedAttributes,
        selectedProtocols: validProtocols,
        scenarios: validScenarios,
        mode,
        messageSize: Number(config.messageSize) || 1024,
        messageFrequency: Number(config.messageFrequency) || 100,
        protocolConfig
      }
    : null;

  return { valid, errors, normalized };
}
