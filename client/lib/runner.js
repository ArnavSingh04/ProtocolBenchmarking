// Starts a benchmark and consumes its streamed events into the local run store.
//
// The server runs the whole benchmark inside one request and streams NDJSON
// events back; we accumulate them into localStorage via runStore. The fetch is
// intentionally not tied to any component, so it keeps running as the user
// navigates from the configuration page to the live-progress page.

import * as runStore from "./runStore";

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/**
 * Create a run, kick off its streaming execution, and return the new id
 * immediately (so the caller can navigate straight to live progress).
 */
export async function startBenchmark(configuration) {
  const id = newId();
  const startTime = new Date().toISOString();
  const total =
    (configuration.selectedProtocols?.length || 0) *
    (configuration.scenarios?.length || 0);

  runStore.saveRun({
    _id: id,
    status: "running",
    startTime,
    endTime: null,
    mode: configuration.mode === "live" ? "live" : "simulation",
    protocols: configuration.selectedProtocols || [],
    scenarios: configuration.scenarios || [],
    attributes: configuration.attributes || [],
    configuration,
    error: null,
    results: {}, // fitness scores, filled in on completion
    progress: {
      current: 0,
      total,
      currentProtocol: null,
      currentScenario: null,
      completed: 0
    },
    measurements: [],
    logs: []
  });

  // Fire-and-forget; the run streams independently of the UI.
  void streamRun(id, configuration);

  return id;
}

function fail(id, message) {
  runStore.patchRun(id, {
    status: "failed",
    error: message,
    endTime: new Date().toISOString()
  });
}

function applyEvent(id, event) {
  switch (event.type) {
    case "progress":
      runStore.patchRun(id, { progress: event.payload });
      break;
    case "result":
      runStore.appendMeasurement(id, {
        _id: newId(),
        testRunId: id,
        ...event.payload
      });
      break;
    case "log":
      runStore.appendLog(id, { _id: newId(), testRunId: id, ...event.payload });
      break;
    case "done":
      runStore.patchRun(id, {
        status: event.payload.status || "completed",
        error: event.payload.error || null,
        results: event.payload.results || {},
        progress: event.payload.progress || runStore.getRun(id)?.progress,
        endTime: event.payload.endTime || new Date().toISOString()
      });
      break;
    default:
      break;
  }
}

async function streamRun(id, configuration) {
  let response;
  try {
    response = await fetch("/api/tests/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configuration, testRunId: id })
    });
  } catch (error) {
    fail(id, error?.message || "Could not reach the benchmark server.");
    return;
  }

  if (!response.ok || !response.body) {
    let message = "Could not start the benchmark run.";
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Non-JSON error body; keep the default message.
    }
    fail(id, message);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      applyEvent(id, JSON.parse(trimmed));
    } catch {
      // Ignore malformed lines and keep reading.
    }
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        flushLine(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    flushLine(buffer);
  } catch (error) {
    fail(id, error?.message || "The benchmark stream was interrupted.");
    return;
  }

  // If the stream ended without a terminal status, don't leave it hanging.
  const run = runStore.getRun(id);
  if (run && run.status === "running") {
    fail(id, "The run ended unexpectedly before finishing.");
  }
}
