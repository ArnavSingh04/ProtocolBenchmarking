// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import { useHistoryData } from "../hooks/useRunData";

function HistoryPage() {
  const navigate = useNavigate();
  const { setActiveTestRunId } = useTestRunContext();
  const { testRuns, isLoading } = useHistoryData();

  const openRun = (runId) => {
    setActiveTestRunId(runId);
    navigate(`/results?testRunId=${runId}`);
  };

  if (isLoading) {
    return (
      <div className="history-page">
        <div className="loading">Loading test history...</div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Test History</h1>
        <button className="new-test-btn" onClick={() => navigate("/")}>
          Run New Test
        </button>
      </div>

      {testRuns.length === 0 ? (
        <div className="empty-state">
          <p>No test runs found.</p>
          <button onClick={() => navigate("/")}>Start Your First Test</button>
        </div>
      ) : (
        <div className="test-runs-list">
          {testRuns.map((run) => (
            <div
              key={run._id}
              className="test-run-card"
              onClick={() => openRun(run._id)}
            >
              <div className="card-header">
                <h3>
                  {run.configuration?.testName ||
                    `Test ${run._id.substring(0, 8)}`}
                </h3>
                <div className={`status-badge ${run.status}`}>
                  {run.status === "running"
                    ? "🟢 Running"
                    : run.status === "completed"
                    ? "✅ Completed"
                    : run.status === "failed"
                    ? "❌ Failed"
                    : "⏸️ Unknown"}
                </div>
              </div>
              <div className="card-info">
                <div className="info-row">
                  <span className="info-label">Protocols:</span>
                  <span className="info-value">
                    {run.protocols?.join(", ") || "N/A"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Scenarios:</span>
                  <span className="info-value">
                    {run.scenarios?.map((s) => s.name || s).join(", ") || "N/A"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Started:</span>
                  <span className="info-value">
                    {run.startTime
                      ? new Date(run.startTime).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                {run.endTime && (
                  <div className="info-row">
                    <span className="info-label">Completed:</span>
                    <span className="info-value">
                      {new Date(run.endTime).toLocaleString()}
                    </span>
                  </div>
                )}
                {run.results && Object.keys(run.results).length > 0 && (
                  <div className="info-row">
                    <span className="info-label">Best Protocol:</span>
                    <span className="info-value">
                      {Object.entries(run.results).sort(
                        (a, b) => (b[1]?.score || 0) - (a[1]?.score || 0)
                      )[0]?.[0] || "N/A"}
                    </span>
                  </div>
                )}
              </div>
              <div className="card-actions">
                <button
                  className="view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRun(run._id);
                  }}
                >
                  View Results & Dashboard
                </button>
                {run.status === "running" && (
                  <button
                    className="dashboard-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTestRunId(run._id);
                      navigate(`/live?testRunId=${run._id}`);
                    }}
                  >
                    Live Progress
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
