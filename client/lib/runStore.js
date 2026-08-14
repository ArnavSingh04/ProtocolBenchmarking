// Client-side run store, backed by localStorage.
//
// Runs used to live in a server database and were fetched per request. On a
// serverless host that can't work without a shared DB, so instead each browser
// keeps its own history here. A tiny pub/sub lets React views re-render as a
// streaming run updates. History is therefore per-browser by design.

const STORAGE_KEY = "protocolbench.runs.v1";
const MAX_RUNS = 50; // cap stored history so localStorage can't grow unbounded
const MAX_LOGS = 1000; // cap logs per run (matches the old server-side limit)

let cache = null;
let swept = false;
const listeners = new Set();

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

// A client-streamed run cannot survive a full page reload — the fetch dies with
// the page. Any run still marked "running" when we first load must therefore
// have been interrupted; settle it as failed so it never hangs forever.
function sweepInterrupted() {
  let changed = false;
  for (const run of Object.values(cache)) {
    if (run && run.status === "running") {
      run.status = "failed";
      run.error =
        run.error ||
        "Run was interrupted — the page was closed or reloaded before it finished.";
      run.endTime = run.endTime || new Date().toISOString();
      changed = true;
    }
  }
  return changed;
}

function load() {
  if (cache) return cache;
  cache = {};
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") cache = parsed;
      }
    } catch {
      cache = {};
    }
  }
  if (!swept) {
    swept = true;
    if (sweepInterrupted()) persist(false);
  }
  return cache;
}

function byNewest(a, b) {
  const at = a?.startTime ? new Date(a.startTime).getTime() : 0;
  const bt = b?.startTime ? new Date(b.startTime).getTime() : 0;
  return bt - at;
}

function persist(notifyListeners = true) {
  if (hasStorage()) {
    // Enforce the run cap by dropping the oldest runs.
    const ids = Object.values(cache)
      .sort(byNewest)
      .slice(MAX_RUNS)
      .map((r) => r._id);
    for (const id of ids) delete cache[id];

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Likely a quota error — drop the oldest run and try once more.
      const oldest = Object.values(cache).sort(byNewest).pop();
      if (oldest) {
        delete cache[oldest._id];
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        } catch {
          // Give up on persisting; in-memory cache still works this session.
        }
      }
    }
  }
  if (notifyListeners) notify();
}

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // A misbehaving subscriber must not break the others.
    }
  }
}

/** Subscribe to any change in the store. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** All runs, newest first. */
export function listRuns() {
  return Object.values(load()).sort(byNewest);
}

/** A single run (with embedded `measurements` and `logs`), or null. */
export function getRun(testRunId) {
  if (!testRunId) return null;
  return load()[testRunId] || null;
}

/** Insert or replace a run record. */
export function saveRun(run) {
  if (!run || !run._id) return;
  load()[run._id] = run;
  persist();
}

/** Shallow-merge updates into a run, replacing its object so React sees a change. */
export function patchRun(testRunId, updates) {
  const store = load();
  const existing = store[testRunId];
  if (!existing) return;
  store[testRunId] = { ...existing, ...updates };
  persist();
}

/** Append one detailed protocol × scenario measurement to a run. */
export function appendMeasurement(testRunId, measurement) {
  const store = load();
  const existing = store[testRunId];
  if (!existing) return;
  store[testRunId] = {
    ...existing,
    measurements: [...(existing.measurements || []), measurement]
  };
  persist();
}

/** Append one execution-log entry to a run (capped at MAX_LOGS). */
export function appendLog(testRunId, log) {
  const store = load();
  const existing = store[testRunId];
  if (!existing) return;
  const logs = [...(existing.logs || []), log];
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
  store[testRunId] = { ...existing, logs };
  persist();
}
