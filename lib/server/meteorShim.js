// Minimal `meteor/meteor` shim. The benchmark engine and protocol testers were
// written for Meteor and call `Meteor.call("testLogs.add", testRunId, entry)`.
//
// Loggers are registered per test run so concurrent runs never clobber one
// another's log routing (the previous single-handler design was racy).

// Global-scoped so per-run loggers survive Next.js dev module reloads that can
// happen while a benchmark is running.
const runLoggers =
  globalThis.__protocolRunLoggers || (globalThis.__protocolRunLoggers = new Map());

export function registerRunLogger(testRunId, fn) {
  if (testRunId && typeof fn === "function") {
    runLoggers.set(testRunId, fn);
  }
}

export function unregisterRunLogger(testRunId) {
  runLoggers.delete(testRunId);
}

export const Meteor = {
  call(methodName, testRunId, payload) {
    if (methodName === "testLogs.add") {
      const fn = runLoggers.get(testRunId);
      if (fn) return fn(payload || {});
    }
    return null;
  }
};
