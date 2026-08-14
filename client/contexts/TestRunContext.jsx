import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import * as runStore from "../lib/runStore";

const TestRunContext = createContext();

export const useTestRunContext = () => {
  const context = useContext(TestRunContext);
  if (!context) {
    throw new Error("useTestRunContext must be used within TestRunProvider");
  }
  return context;
};

function readStoredId() {
  try {
    return localStorage.getItem("currentTestRunId") || null;
  } catch {
    return null;
  }
}

export const TestRunProvider = ({ children }) => {
  const [currentTestRunId, setCurrentTestRunId] = useState(readStoredId);
  const [latestTestRunId, setLatestTestRunId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  const refreshSession = useCallback(async () => {
    const runs = runStore.listRuns();
    const latest = runs[0]?._id || null;
    setLatestTestRunId(latest);

    const stored = readStoredId();
    if (stored && runStore.getRun(stored)) {
      setCurrentTestRunId(stored);
    } else if (stored) {
      // Stored run no longer exists in this browser — fall back to latest.
      try {
        localStorage.removeItem("currentTestRunId");
      } catch {
        /* ignore storage errors */
      }
      setCurrentTestRunId(latest);
    } else if (latest) {
      setCurrentTestRunId(latest);
    }

    setSessionReady(true);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Keep "latest" fresh as runs are created/updated in the store.
  useEffect(() => {
    const update = () => {
      const runs = runStore.listRuns();
      setLatestTestRunId(runs[0]?._id || null);
    };
    return runStore.subscribe(update);
  }, []);

  useEffect(() => {
    try {
      if (currentTestRunId) {
        localStorage.setItem("currentTestRunId", currentTestRunId);
      } else {
        localStorage.removeItem("currentTestRunId");
      }
    } catch {
      /* ignore storage errors */
    }
  }, [currentTestRunId]);

  const setActiveTestRunId = useCallback((testRunId) => {
    if (testRunId) {
      setCurrentTestRunId(testRunId);
    }
  }, []);

  const clearActiveTestRun = useCallback(() => {
    setCurrentTestRunId(latestTestRunId);
  }, [latestTestRunId]);

  const value = useMemo(
    () => ({
      currentTestRunId,
      latestTestRunId,
      sessionReady,
      setCurrentTestRunId: setActiveTestRunId,
      setActiveTestRunId,
      clearActiveTestRun,
      refreshSession
    }),
    [
      currentTestRunId,
      latestTestRunId,
      sessionReady,
      setActiveTestRunId,
      clearActiveTestRun,
      refreshSession
    ]
  );

  return (
    <TestRunContext.Provider value={value}>{children}</TestRunContext.Provider>
  );
};
