import { useEffect, useMemo, useState } from "react";
import { fetchHistory, fetchLogs, fetchResults, fetchRun } from "../lib/api";

export function useHistoryData() {
  const [testRuns, setTestRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const runs = await fetchHistory();
        if (!isCancelled) {
          setTestRuns(runs);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    load();
    const intervalId = setInterval(load, 4000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return { testRuns, isLoading, error };
}

export function useRunData(testRunId, includeLogs = false) {
  const [testRun, setTestRun] = useState(null);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(testRunId));
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!testRunId) {
      setTestRun(null);
      setResults([]);
      setLogs([]);
      setIsLoading(false);
      setHasLoaded(true);
      setError(null);
      return;
    }

    let eventSource;
    let pollIntervalId;
    let isCancelled = false;

    let hasInitialLoad = false;

    const loadSnapshot = async () => {
      if (!hasInitialLoad) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const [run, runResults, runLogs] = await Promise.all([
          fetchRun(testRunId),
          fetchResults(testRunId),
          includeLogs ? fetchLogs(testRunId) : Promise.resolve([])
        ]);

        if (!isCancelled) {
          setTestRun(run);
          setResults(runResults);
          setLogs(runLogs);
          setIsLoading(false);
          setHasLoaded(true);
          hasInitialLoad = true;
        }
      } catch (err) {
        if (!isCancelled) {
          setIsLoading(false);
          setHasLoaded(true);
          setError(err);
        }
      }
    };

    loadSnapshot();

    const setupEventSource = () => {
      if (isCancelled) return;
      eventSource = new EventSource(
        `/api/tests/stream?testRunId=${encodeURIComponent(testRunId)}`
      );

      eventSource.onmessage = (messageEvent) => {
        if (isCancelled) {
          return;
        }

        try {
          const event = JSON.parse(messageEvent.data);
          switch (event.type) {
            case "snapshot":
              setTestRun(event.payload.testRun || null);
              setResults(event.payload.results || []);
              if (includeLogs) {
                setLogs(event.payload.logs || []);
              }
              setIsLoading(false);
              setHasLoaded(true);
              setError(null);
              break;
            case "run_updated":
              setTestRun(event.payload);
              break;
            case "result_added":
              setResults((previous) => [...previous, event.payload]);
              break;
            case "log_added":
              if (includeLogs) {
                setLogs((previous) => [...previous, event.payload]);
              }
              break;
            default:
              break;
          }
        } catch {
          // Ignore malformed stream payloads and keep the connection alive.
        }
      };

      eventSource.onerror = () => {
        if (isCancelled) {
          return;
        }
        eventSource?.close();
      };
    };

    setupEventSource();
    // Poll as a safety net when SSE is unavailable after dev-server restarts.
    pollIntervalId = setInterval(loadSnapshot, 4000);

    return () => {
      isCancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
  }, [testRunId, includeLogs]);

  return useMemo(
    () => ({
      testRun,
      results,
      logs,
      isLoading,
      hasLoaded,
      error
    }),
    [testRun, results, logs, isLoading, hasLoaded, error]
  );
}
