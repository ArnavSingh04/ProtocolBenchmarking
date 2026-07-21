import React from "react";
import { useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import { useHistoryData } from "../hooks/useRunData";
import {
  rankedProtocols,
  protocolColor,
  durationBetween,
  formatDuration
} from "../../imports/shared/metrics";

const STATUS_LABEL = {
  running: "Running",
  completed: "Completed",
  failed: "Failed"
};

function bestProtocol(run) {
  const ranked = rankedProtocols(run.results || {}).filter(([, d]) => !d.failed);
  return ranked[0]?.[0] || null;
}

function HistoryPage() {
  const navigate = useNavigate();
  const { setActiveTestRunId } = useTestRunContext();
  const { testRuns, isLoading, error } = useHistoryData();

  const openResults = (runId) => {
    setActiveTestRunId(runId);
    navigate(`/results?testRunId=${runId}`);
  };

  if (isLoading) {
    return (
      <div className="container history-page">
        <div className="history-header">
          <h1>Test history</h1>
        </div>
        <div className="history-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="history-card skeleton-card">
              <div className="skeleton" style={{ height: 22, width: "40%" }} />
              <div className="skeleton" style={{ height: 14, width: "70%", marginTop: 12 }} />
              <div className="skeleton" style={{ height: 14, width: "55%", marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container history-page">
      <div className="history-header">
        <h1>Test history</h1>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Run new test
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span className="alert-icon" aria-hidden="true">⚠</span>
          <span>Could not load history. It will retry automatically.</span>
        </div>
      )}

      {testRuns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">🗂️</div>
          <h2>No tests yet</h2>
          <p>
            Your benchmark runs will appear here. Configure protocols, scenarios
            and attribute weights to run your first comparison.
          </p>
          <div className="state-actions">
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Start your first test
            </button>
          </div>
        </div>
      ) : (
        <ul className="history-list">
          {testRuns.map((run) => {
            const best = bestProtocol(run);
            const duration = durationBetween(run.startTime, run.endTime);
            const mode = run.mode || run.configuration?.mode || "simulation";
            const scenarioNames = (run.scenarios || [])
              .map((s) => s.name || s)
              .join(", ");
            return (
              <li key={run._id} className="history-card">
                <div className="history-card-main">
                  <div className="history-card-head">
                    <button
                      className="history-title-btn"
                      onClick={() => openResults(run._id)}
                    >
                      {run.configuration?.testName || `Test ${run._id.slice(0, 8)}`}
                    </button>
                    <div className="history-badges">
                      <span className={`badge ${mode === "live" ? "badge-warning" : "badge-primary"}`}>
                        {mode === "live" ? "Live" : "Simulated"}
                      </span>
                      <span className={`status-badge ${run.status}`}>
                        {STATUS_LABEL[run.status] || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <dl className="history-meta">
                    <div>
                      <dt>Protocols</dt>
                      <dd className="proto-list">
                        {(run.protocols || []).map((p, i) => (
                          <span key={p} className="protocol-chip">
                            <span className="protocol-dot" style={{ background: protocolColor(p, i) }} />
                            {p}
                          </span>
                        ))}
                      </dd>
                    </div>
                    <div>
                      <dt>Scenarios</dt>
                      <dd className="truncate" title={scenarioNames}>
                        {scenarioNames || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>Started</dt>
                      <dd>{run.startTime ? new Date(run.startTime).toLocaleString() : "—"}</dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>{duration != null ? formatDuration(duration) : "—"}</dd>
                    </div>
                    {best && (
                      <div>
                        <dt>Best fit</dt>
                        <dd>
                          <span className="protocol-chip">
                            <span className="protocol-dot" style={{ background: protocolColor(best) }} />
                            {best}
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="history-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openResults(run._id)}>
                    View results
                  </button>
                  {run.status === "running" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setActiveTestRunId(run._id);
                        navigate(`/live?testRunId=${run._id}`);
                      }}
                    >
                      Live progress
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default HistoryPage;
