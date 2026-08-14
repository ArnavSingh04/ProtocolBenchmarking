import { useEffect, useMemo, useState } from "react";
import * as runStore from "../lib/runStore";

/** History list, backed by the local run store and kept live via subscription. */
export function useHistoryData() {
  const [testRuns, setTestRuns] = useState(() => runStore.listRuns());

  useEffect(() => {
    const update = () => setTestRuns(runStore.listRuns());
    update();
    return runStore.subscribe(update);
  }, []);

  return { testRuns, isLoading: false, error: null };
}

/**
 * Read a single run (and its measurements/logs) from the local store,
 * re-rendering whenever the store changes — e.g. as a run streams in.
 */
export function useRunData(testRunId, includeLogs = false) {
  // Bumped on every store change so the memo below recomputes from fresh data.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!testRunId) return undefined;
    const update = () => setTick((t) => t + 1);
    update();
    return runStore.subscribe(update);
  }, [testRunId]);

  return useMemo(() => {
    const empty = {
      testRun: null,
      results: [],
      logs: [],
      isLoading: false,
      hasLoaded: true,
      error: null
    };
    if (!testRunId) return empty;

    const run = runStore.getRun(testRunId);
    if (!run) return empty;

    const { measurements, logs, ...testRun } = run;
    return {
      testRun,
      results: measurements || [],
      logs: includeLogs ? logs || [] : [],
      isLoading: false,
      hasLoaded: true,
      error: null
    };
  }, [testRunId, includeLogs, tick]);
}
