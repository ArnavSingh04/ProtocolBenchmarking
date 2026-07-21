import { describe, it, expect } from "vitest";
import { createMocks } from "node-mocks-http";
import handler from "../../pages/api/tests/startRun";
import { getRunById } from "../../lib/server/runService";

const validConfig = {
  testName: "API test",
  attributes: [
    { name: "latency", weight: 50 },
    { name: "reliability", weight: 50 }
  ],
  selectedProtocols: ["MQTT", "HTTP"],
  scenarios: [{ name: "Stable Network" }],
  mode: "simulation"
};

async function invoke(method, body) {
  const { req, res } = createMocks({ method, body });
  await handler(req, res);
  return res;
}

describe("POST /api/tests/startRun", () => {
  it("rejects non-POST methods", async () => {
    const res = await invoke("GET", {});
    expect(res._getStatusCode()).toBe(405);
  });

  it("returns 400 with field errors for invalid configuration", async () => {
    const res = await invoke("POST", {
      configuration: { ...validConfig, selectedProtocols: [] }
    });
    expect(res._getStatusCode()).toBe(400);
    const body = res._getJSONData();
    expect(body.fieldErrors).toBeTruthy();
    expect(body.fieldErrors.protocols).toBeTruthy();
  });

  it("rejects a malformed testRunId", async () => {
    const res = await invoke("POST", {
      configuration: validConfig,
      testRunId: "../nope"
    });
    expect(res._getStatusCode()).toBe(400);
  });

  it("accepts a valid configuration and creates a run", async () => {
    const testRunId = "itest-" + "a1b2c3d4e5f6";
    const res = await invoke("POST", { configuration: validConfig, testRunId });
    expect(res._getStatusCode()).toBe(200);
    const body = res._getJSONData();
    expect(body.testRunId).toBe(testRunId);

    const run = await getRunById(testRunId);
    expect(run).toBeTruthy();
    expect(run.protocols).toEqual(["MQTT", "HTTP"]);
  });

  it("does not leak internal error details", async () => {
    // Missing configuration entirely → validation 400, never a stack trace.
    const res = await invoke("POST", {});
    expect(res._getStatusCode()).toBe(400);
    const body = res._getJSONData();
    expect(JSON.stringify(body)).not.toMatch(/at .*\(/); // no stack frames
  });
});
