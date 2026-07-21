import { describe, it, expect } from "vitest";
import {
  validateConfiguration,
  isWeightTotalValid,
  sumWeights,
  isValidRunId
} from "../../imports/shared/validation";

const baseAttributes = [
  { name: "latency", weight: 50 },
  { name: "reliability", weight: 50 }
];

const validConfig = (overrides = {}) => ({
  testName: "My Test",
  attributes: baseAttributes,
  selectedProtocols: ["MQTT", "HTTP"],
  scenarios: [{ name: "Stable Network" }],
  mode: "simulation",
  ...overrides
});

describe("isWeightTotalValid", () => {
  it("accepts exactly 100", () => expect(isWeightTotalValid(100)).toBe(true));
  it("absorbs float rounding within tolerance", () => {
    expect(isWeightTotalValid(99.9)).toBe(true);
    expect(isWeightTotalValid(100.4)).toBe(true);
  });
  it("rejects clearly invalid totals", () => {
    expect(isWeightTotalValid(90)).toBe(false);
    expect(isWeightTotalValid(101)).toBe(false);
  });
});

describe("sumWeights", () => {
  it("ignores non-numeric weights", () => {
    expect(sumWeights([{ weight: 40 }, { weight: "x" }, { weight: 60 }])).toBe(100);
  });
});

describe("validateConfiguration", () => {
  it("accepts a valid configuration and normalises it", () => {
    const { valid, normalized, errors } = validateConfiguration(validConfig());
    expect(valid).toBe(true);
    expect(errors).toEqual({});
    expect(normalized.selectedProtocols).toEqual(["MQTT", "HTTP"]);
    expect(normalized.mode).toBe("simulation");
  });

  it("requires at least one protocol", () => {
    const { valid, errors } = validateConfiguration(
      validConfig({ selectedProtocols: [] })
    );
    expect(valid).toBe(false);
    expect(errors.protocols).toBeTruthy();
  });

  it("drops unknown protocols", () => {
    const { normalized } = validateConfiguration(
      validConfig({ selectedProtocols: ["MQTT", "TELEPATHY"] })
    );
    expect(normalized.selectedProtocols).toEqual(["MQTT"]);
  });

  it("requires at least one scenario", () => {
    const { valid, errors } = validateConfiguration(
      validConfig({ scenarios: [] })
    );
    expect(valid).toBe(false);
    expect(errors.scenarios).toBeTruthy();
  });

  it("rejects weights that do not total 100", () => {
    const { valid, errors } = validateConfiguration(
      validConfig({
        attributes: [
          { name: "latency", weight: 30 },
          { name: "reliability", weight: 30 }
        ]
      })
    );
    expect(valid).toBe(false);
    expect(errors.weights).toBeTruthy();
  });

  it("supplies a default test name when omitted", () => {
    const { normalized } = validateConfiguration(
      validConfig({ testName: "" })
    );
    expect(normalized.testName).toMatch(/^Test /);
  });

  it("rejects an overly long test name", () => {
    const { valid, errors } = validateConfiguration(
      validConfig({ testName: "x".repeat(200) })
    );
    expect(valid).toBe(false);
    expect(errors.testName).toBeTruthy();
  });

  it("validates live-mode endpoint schemes", () => {
    const { valid, errors } = validateConfiguration(
      validConfig({
        mode: "live",
        protocolConfig: { mqttBrokerUrl: "http://not-mqtt" }
      })
    );
    expect(valid).toBe(false);
    expect(errors.mqttBrokerUrl).toBeTruthy();
  });

  it("ignores endpoint schemes in simulation mode", () => {
    const { valid } = validateConfiguration(
      validConfig({
        mode: "simulation",
        protocolConfig: { mqttBrokerUrl: "not a url at all" }
      })
    );
    expect(valid).toBe(true);
  });
});

describe("isValidRunId", () => {
  it("accepts UUID-like ids", () => {
    expect(isValidRunId("1062511b-6c71-41aa-90ff-c36cc4751da6")).toBe(true);
  });
  it("rejects junk", () => {
    expect(isValidRunId("")).toBe(false);
    expect(isValidRunId("short")).toBe(false);
    expect(isValidRunId("../etc/passwd")).toBe(false);
    expect(isValidRunId(null)).toBe(false);
  });
});
