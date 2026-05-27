import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";

/**
 * Resolves the active test run ID from URL, persisted session, or latest history entry.
 */
export function useEffectiveTestRunId() {
  const [searchParams] = useSearchParams();
  const urlTestRunId = searchParams.get("testRunId");
  const {
    currentTestRunId,
    latestTestRunId,
    sessionReady,
    setActiveTestRunId
  } = useTestRunContext();

  const testRunId = urlTestRunId || currentTestRunId || latestTestRunId || null;

  useEffect(() => {
    if (urlTestRunId && urlTestRunId !== currentTestRunId) {
      setActiveTestRunId(urlTestRunId);
    }
  }, [urlTestRunId, currentTestRunId, setActiveTestRunId]);

  return useMemo(
    () => ({
      testRunId,
      sessionReady,
      urlTestRunId,
      isViewingLatest:
        Boolean(testRunId) &&
        !urlTestRunId &&
        testRunId === latestTestRunId
    }),
    [testRunId, sessionReady, urlTestRunId, latestTestRunId]
  );
}
