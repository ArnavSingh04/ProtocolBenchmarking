// Chatgpt by openAI was used to assist in the writing the code for the following file
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { fetchHistory, fetchRun } from "../lib/api";

const TestRunContext = createContext();

export const useTestRunContext = () => {
  const context = useContext(TestRunContext);
  if (!context) {
    throw new Error("useTestRunContext must be used within TestRunProvider");
  }
  return context;
};

export const TestRunProvider = ({ children }) => {
  const [currentTestRunId, setCurrentTestRunId] = useState(() => {
    return localStorage.getItem("currentTestRunId") || null;
  });
  const [latestTestRunId, setLatestTestRunId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const runs = await fetchHistory();
      const latest = runs[0]?._id || null;
      setLatestTestRunId(latest);

      const stored = localStorage.getItem("currentTestRunId");
      if (stored) {
        const run = await fetchRun(stored);
        if (run) {
          setCurrentTestRunId(stored);
        } else {
          localStorage.removeItem("currentTestRunId");
          setCurrentTestRunId(latest);
        }
      } else if (latest) {
        setCurrentTestRunId(latest);
      }
    } catch {
      // Keep existing session state if history fetch fails temporarily.
    } finally {
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (currentTestRunId) {
      localStorage.setItem("currentTestRunId", currentTestRunId);
    } else {
      localStorage.removeItem("currentTestRunId");
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
