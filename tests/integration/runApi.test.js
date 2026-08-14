import { describe, it, expect } from "vitest";
import { createMocks } from "node-mocks-http";
import handler from "../../pages/api/tests/run";

const validConfig = {
  testName: "API run test",
  attributes: [
    { name: "latency", weight: 50 },
    { name: "reliability", weight: 50 }
  ],
  selectedProtocols: ["MQTT", "HTTP"],
  scenarios: [{ name: "Stable Network" }],
  mode: "simulation",
  fast: true
};

async function invoke(method, body) {
  const { req, res } = createMocks({ method, body });
  await handler(req, res);
  return res;
}

function parseNdjson(res) {
  return res
    ._getData()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe("POST /api/tests/run", () => {
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
    expect(body.fieldErrors?.protocols).toBeTruthy();
  });

  it("rejects a malformed testRunId", async () => {
    const res = await invoke("POST", {
      configuration: validConfig,
      testRunId: "../nope"
    });
    expect(res._getStatusCode()).toBe(400);
  });

  it("streams NDJSON events and ends with a completed run", async () => {
    const testRunId = "itest-" + "a1b2c3d4e5f6";
    const res = await invoke("POST", { configuration: validConfig, testRunId });

    expect(res._getStatusCode()).toBe(200);
    const events = parseNdjson(res);

    const results = events.filter((e) => e.type === "result");
    expect(results).toHaveLength(2); // 2 protocols × 1 scenario

    const done = events.filter((e) => e.type === "done").pop();
    expect(done.payload.status).toBe("completed");
    expect(Object.keys(done.payload.results)).toEqual(
      expect.arrayContaining(["MQTT", "HTTP"])
    );
  });

  it("does not leak internal error details on invalid input", async () => {
    const res = await invoke("POST", {});
    expect(res._getStatusCode()).toBe(400);
    const body = res._getJSONData();
    expect(JSON.stringify(body)).not.toMatch(/at .*\(/);
  });
});
