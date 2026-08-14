// The app no longer talks to a stateful server API for run history — runs are
// executed via a single streaming endpoint and stored per-browser. This module
// stays as the stable entry point the configuration page imports.
export { startBenchmark as startRun } from "./runner";
