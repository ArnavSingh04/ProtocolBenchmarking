// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import ProtocolComparisonChart from "../components/charts/ProtocolComparisonChart";
import LatencyTrendChart from "../components/charts/LatencyTrendChart";
import RadarChart from "../components/charts/RadarChart";
import TestProgressLog from "../components/TestProgressLog";
import { useRunData } from "../hooks/useRunData";

function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentTestRunId } = useTestRunContext();
  const testRunId = searchParams.get("testRunId");

  const { testRun, results, isLoading, hasLoaded } = useRunData(
    testRunId,
    false
  );

  // The subscriptions and useTracker will automatically update when data changes
  // Reactive data updates automatically when the database changes

  if (!testRunId) {
    return (
      <div className="dashboard">
        <div className="error-message">
          <h2>No Test Run Selected</h2>
          <p>Please start a test from the Configuration page.</p>
          <button onClick={() => navigate("/")}>Go to Configuration</button>
        </div>
      </div>
    );
  }

  // Show initial loading state only briefly, then show dashboard even if data is still loading
  if (isLoading && !testRun) {
    return (
      <div className="dashboard">
        <div className="loading">
          <p>Connecting to server...</p>
          {testRunId && (
            <p
              style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}
            >
              Test Run ID: {testRunId}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!testRun && hasLoaded) {
    return (
      <div className="dashboard">
        <div className="error-message">
          <h2>Test Run Not Found</h2>
          <p>
            This test run ID may be old or expired (for local in-memory mode,
            runs are cleared when the server restarts).
          </p>
          <button
            onClick={() => {
              setCurrentTestRunId(null);
              navigate("/");
            }}
          >
            Go to Configuration
          </button>
        </div>
      </div>
    );
  }

  if (!testRun) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Test Dashboard</h1>
          <div className="status-badge running">🟢 Starting</div>
        </div>
        <div className="dashboard-content">
          <div className="test-progress">
            <h3>Initializing Test</h3>
            <div className="progress-info">
              <div className="progress-stats">
                <span>Test Run ID: {testRunId}</span>
              </div>
              <p className="progress-message">
                Setting up test environment. Progress will appear here
                shortly...
              </p>
            </div>
            <TestProgressLog testRunId={testRunId} />
          </div>
        </div>
      </div>
    );
  }

  const isRunning = testRun.status === "running";
  const protocols = testRun.protocols || [];
  const scenarios = testRun.scenarios || [];

  // Group results by protocol
  const resultsByProtocol = {};
  protocols.forEach((protocol) => {
    resultsByProtocol[protocol] = results.filter(
      (r) => r.protocol === protocol
    );
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Test Dashboard</h1>
        <div className={`status-badge ${testRun.status}`}>
          {testRun.status === "running" ? "🟢 Running" : "✅ Completed"}
        </div>
      </div>

      <div className="dashboard-content">
        {(isRunning || testRun.status === "running") && (
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
                  ></div>
                </div>
                <p className="progress-message">
                  {testRun.progress.currentProtocol
                    ? `Testing ${testRun.progress.currentProtocol}${
                        testRun.progress.currentScenario
                          ? ` under ${testRun.progress.currentScenario}`
                          : ""
                      }...`
                    : "Starting tests..."}
                </p>
              </>
            ) : (
              <>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
                <p>Tests are running. Results will appear in real-time...</p>
              </>
            )}
            <div className="test-summary">
              <div className="summary-item">
                <strong>Protocols:</strong> {protocols.join(", ")}
              </div>
              <div className="summary-item">
                <strong>Scenarios:</strong>{" "}
                {scenarios.map((s) => s.name || s).join(", ")}
              </div>
              <div className="summary-item">
                <strong>Total Tests:</strong>{" "}
                {protocols.length * scenarios.length}
              </div>
            </div>
            <TestProgressLog testRunId={testRunId} />
          </div>
        )}

        {testRun.results && (
          <div className="results-section">
            <h2>Fitness Scores</h2>
            <div className="fitness-scores">
              {Object.entries(testRun.results).map(([protocol, data]) => (
                <div key={protocol} className="fitness-card">
                  <h3>{protocol}</h3>
                  <div className="score-value">{data.score}/100</div>
                  <div className="recommendation">{data.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(results.length > 0 || testRun.status === "completed") && (
          <>
            <div className="chart-section">
              <h2>Protocol Comparison</h2>
              {results.length > 0 ? (
                <ProtocolComparisonChart results={results} />
              ) : (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666"
                  }}
                >
                  No comparison data available yet
                </div>
              )}
            </div>

            <div className="chart-section">
              <h2>Latency Trends</h2>
              {results.length > 0 ? (
                <LatencyTrendChart results={results} />
              ) : (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666"
                  }}
                >
                  No latency data available yet
                </div>
              )}
            </div>

            <div className="chart-section">
              <h2>Attribute Comparison (Radar)</h2>
              {results.length > 0 ? (
                <RadarChart results={results} attributes={testRun.attributes} />
              ) : (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666"
                  }}
                >
                  No comparison data available yet
                </div>
              )}
            </div>
          </>
        )}

        {results.length === 0 && testRun.status === "completed" && (
          <div className="warning-message">
            <p>
              ⚠️ Tests completed but no results found. Check server console for
              errors.
            </p>
          </div>
        )}

        <div className="action-buttons">
          {testRun.status === "running" && (
            <button
              className="live-progress-btn"
              onClick={() => navigate(`/live?testRunId=${testRunId}`)}
            >
              View Live Progress
            </button>
          )}
          {testRun.status === "completed" && (
            <button
              className="view-results-btn"
              onClick={() => navigate(`/results?testRunId=${testRunId}`)}
            >
              View Detailed Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
