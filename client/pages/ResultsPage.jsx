// Chatgpt by openAI was used to assist in the writing the code for the following file
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import { useEffectiveTestRunId } from "../hooks/useEffectiveTestRunId";
import { useRunData } from "../hooks/useRunData";
import ProtocolComparisonChart from "../components/charts/ProtocolComparisonChart";
import LatencyTrendChart from "../components/charts/LatencyTrendChart";
import RadarChart from "../components/charts/RadarChart";
import TestProgressLog from "../components/TestProgressLog";

function ResultsPage() {
  const navigate = useNavigate();
  const { clearActiveTestRun, latestTestRunId, refreshSession } =
    useTestRunContext();
  const { testRunId, sessionReady, urlTestRunId, isViewingLatest } =
    useEffectiveTestRunId();

  const { testRun, results, isLoading, hasLoaded } = useRunData(
    sessionReady ? testRunId : null,
    false
  );

  useEffect(() => {
    if (testRun?.status === "completed" || testRun?.status === "failed") {
      refreshSession();
    }
  }, [testRun?.status, refreshSession]);

  const handleDownloadReport = () => {
    if (!testRun) return;

    const report = {
      testRun: {
        id: testRun._id,
        testName: testRun.configuration?.testName || "Untitled Test",
        startTime: testRun.startTime,
        endTime: testRun.endTime,
        status: testRun.status,
        protocols: testRun.protocols,
        scenarios: testRun.scenarios
      },
      results: testRun.results,
      detailedResults: results,
      attributes: testRun.attributes
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `protocol-test-report-${testRun._id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!sessionReady || (isLoading && !testRun)) {
    return (
      <div className="results-page">
        <div className="loading">Loading test results...</div>
      </div>
    );
  }

  if (!testRunId) {
    return (
      <div className="results-page">
        <div className="error-message">
          <h2>No Tests Yet</h2>
          <p>Run a benchmark from Configuration to see results here.</p>
          <button onClick={() => navigate("/")}>Go to Configuration</button>
        </div>
      </div>
    );
  }

  if (!testRun && hasLoaded) {
    return (
      <div className="results-page">
        <div className="error-message">
          <h2>Test Run Not Found</h2>
          <p>
            This test may have been removed. Pick another run from History or
            start a new test.
          </p>
          <div className="action-buttons">
            {latestTestRunId && (
              <button
                onClick={() => {
                  clearActiveTestRun();
                  refreshSession();
                  navigate(`/results?testRunId=${latestTestRunId}`);
                }}
              >
                View Latest Test
              </button>
            )}
            <button onClick={() => navigate("/history")}>Browse History</button>
            <button onClick={() => navigate("/")}>New Test</button>
          </div>
        </div>
      </div>
    );
  }

  if (!testRun) {
    return (
      <div className="results-page">
        <div className="loading">Connecting to test run...</div>
      </div>
    );
  }

  const isRunning = testRun.status === "running";
  const protocols = testRun.protocols || [];
  const scenarios = testRun.scenarios || [];

  const sortedResults = testRun.results
    ? Object.entries(testRun.results).sort(
        (a, b) => (b[1]?.score || 0) - (a[1]?.score || 0)
      )
    : [];

  const resultsLink = (path) =>
    testRunId ? `${path}?testRunId=${testRunId}` : path;

  return (
    <div className="results-page dashboard">
      <div className="results-header dashboard-header">
        <div>
          <h1>Results & Dashboard</h1>
          {isViewingLatest && (
            <p className="section-description" style={{ marginTop: "0.25rem" }}>
              Showing your most recent test run
            </p>
          )}
          {urlTestRunId && urlTestRunId !== latestTestRunId && (
            <p className="section-description" style={{ marginTop: "0.25rem" }}>
              Viewing a past test from history
            </p>
          )}
        </div>
        <div className="header-actions">
          <div className={`status-badge ${testRun.status}`}>
            {isRunning
              ? "🟢 Running"
              : testRun.status === "completed"
              ? "✅ Completed"
              : testRun.status === "failed"
              ? "❌ Failed"
              : "⏸️ Unknown"}
          </div>
          {testRun.status === "completed" && sortedResults.length > 0 && (
            <button className="download-btn" onClick={handleDownloadReport}>
              Download Report
            </button>
          )}
          {isRunning && (
            <button
              className="action-btn"
              onClick={() => navigate(resultsLink("/live"))}
            >
              Live Progress
            </button>
          )}
        </div>
      </div>

      <div className="results-content dashboard-content">
        <div className="test-info">
          <h2>Test Configuration</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Test Name:</span>
              <span className="info-value">
                {testRun.configuration?.testName || "Untitled"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Start Time:</span>
              <span className="info-value">
                {testRun.startTime
                  ? new Date(testRun.startTime).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">End Time:</span>
              <span className="info-value">
                {testRun.endTime
                  ? new Date(testRun.endTime).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Protocols:</span>
              <span className="info-value">
                {protocols.join(", ") || "N/A"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Scenarios:</span>
              <span className="info-value">
                {scenarios.map((s) => s.name || s).join(", ") || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {isRunning && (
          <div className="test-progress">
            <h3>Test Progress</h3>
            {testRun.progress ? (
              <>
                <div className="progress-info">
                  <div className="progress-stats">
                    <span>
                      Test {testRun.progress.completed || 0} of{" "}
                      {testRun.progress.total || 0}
                    </span>
                    <span className="progress-percentage">
                      {testRun.progress.total > 0
                        ? Math.round(
                            ((testRun.progress.completed || 0) /
                              testRun.progress.total) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  {testRun.progress.currentProtocol && (
                    <div className="current-test">
                      <strong>Current:</strong>{" "}
                      {testRun.progress.currentProtocol}
                      {testRun.progress.currentScenario &&
                        ` - ${testRun.progress.currentScenario}`}
                    </div>
                  )}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        testRun.progress.total > 0
                          ? ((testRun.progress.completed || 0) /
                              testRun.progress.total) *
                            100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </>
            ) : (
              <p>Tests are running. Charts update as results arrive.</p>
            )}
            <TestProgressLog testRunId={testRunId} />
          </div>
        )}

        {sortedResults.length > 0 && (
          <div className="fitness-scores-section">
            <h2>Fitness Scores & Recommendations</h2>
            <div className="rankings">
              {sortedResults.map(([protocol, data], index) => (
                <div key={protocol} className="ranking-card">
                  <div className="rank-badge">#{index + 1}</div>
                  <div className="ranking-content">
                    <h3>{protocol}</h3>
                    <div className="score-display">
                      <span className="score-label">Fitness Score:</span>
                      <span className="score-value-large">
                        {data.score}/100
                      </span>
                    </div>
                    <div className="recommendation-box">
                      <strong>Recommendation:</strong>
                      <p>{data.recommendation}</p>
                    </div>
                    <div className="key-metrics">
                      <div className="metric">
                        <span className="metric-label">Avg Latency:</span>
                        <span className="metric-value">
                          {data.metrics?.latency
                            ? `${data.metrics.latency.toFixed(2)}ms`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Reliability:</span>
                        <span className="metric-value">
                          {data.metrics?.reliability
                            ? `${data.metrics.reliability.toFixed(1)}%`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Throughput:</span>
                        <span className="metric-value">
                          {data.metrics?.throughput
                            ? `${(data.metrics.throughput / 1000).toFixed(2)}kbps`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(results.length > 0 || testRun.status === "completed" || isRunning) && (
          <>
            <div className="chart-section">
              <h2>Protocol Comparison</h2>
              {results.length > 0 ? (
                <ProtocolComparisonChart results={results} />
              ) : (
                <div className="chart-empty">No comparison data yet</div>
              )}
            </div>

            <div className="chart-section">
              <h2>Latency Trends</h2>
              {results.length > 0 ? (
                <LatencyTrendChart results={results} />
              ) : (
                <div className="chart-empty">No latency data yet</div>
              )}
            </div>

            <div className="chart-section">
              <h2>Attribute Comparison (Radar)</h2>
              {results.length > 0 ? (
                <RadarChart results={results} attributes={testRun.attributes} />
              ) : (
                <div className="chart-empty">No radar data yet</div>
              )}
            </div>
          </>
        )}

        {results.length === 0 && testRun.status === "completed" && (
          <div className="warning-message">
            <p>
              Tests completed but detailed metrics are missing. Check server logs
              for errors.
            </p>
          </div>
        )}

        <div className="action-buttons">
          <button onClick={() => navigate("/history")}>History</button>
          <button className="new-test-btn" onClick={() => navigate("/")}>
            Run New Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
