import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import { useEffectiveTestRunId } from "../hooks/useEffectiveTestRunId";
import { useRunData } from "../hooks/useRunData";
import ProtocolComparisonChart from "../components/charts/ProtocolComparisonChart";
import LatencyTrendChart from "../components/charts/LatencyTrendChart";
import {
  isResultFailed,
  protocolColor,
  formatMetricValue
} from "../../imports/shared/metrics";
import { logType, LOG_FILTERS } from "../lib/logTypes";

function protocolStatus(protocol, { resultsByProtocol, scenarioCount, testRun }) {
  const list = resultsByProtocol[protocol] || [];
  const done = list.length;
  const runStatus = testRun?.status;
  const isCurrent = testRun?.progress?.currentProtocol === protocol;
  const failedAll = done > 0 && list.every((r) => isResultFailed(r.metrics));

  if (runStatus === "running") {
    if (isCurrent) return "running";
    if (done >= scenarioCount && scenarioCount > 0)
      return failedAll ? "failed" : "completed";
    if (done > 0) return "running";
    return "pending";
  }
  // Run finished
  if (done === 0) return "failed";
  return failedAll ? "failed" : "completed";
}

const STATUS_LABEL = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed"
};

function LiveProgressPage() {
  const navigate = useNavigate();
  const { clearActiveTestRun, latestTestRunId, refreshSession } =
    useTestRunContext();
  const { testRunId, sessionReady } = useEffectiveTestRunId();
  const { testRun, results, logs, isLoading, hasLoaded } = useRunData(
    sessionReady ? testRunId : null,
    true
  );

  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("all");
  const logContainerRef = useRef(null);

  const isRunning = testRun?.status === "running";
  const protocols = testRun?.protocols || [];
  const scenarios = testRun?.scenarios || [];
  const scenarioCount = scenarios.length;
  const mode = testRun?.mode || testRun?.configuration?.mode || "simulation";

  const resultsByProtocol = useMemo(() => {
    const map = {};
    results.forEach((r) => {
      if (!map[r.protocol]) map[r.protocol] = [];
      map[r.protocol].push(r);
    });
    return map;
  }, [results]);

  const logsByProtocol = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      if (log.protocol) {
        if (!map[log.protocol]) map[log.protocol] = [];
        map[log.protocol].push(log);
      }
    });
    return map;
  }, [logs]);

  const activeFilter = LOG_FILTERS.find((f) => f.id === filter) || LOG_FILTERS[0];
  const filteredLogs = activeFilter.types
    ? logs.filter((l) => activeFilter.types.includes(l.type))
    : logs;

  const completed = testRun?.progress?.completed || 0;
  const total = testRun?.progress?.total || protocols.length * scenarioCount || 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Auto-scroll to newest logs unless the user has scrolled up to inspect.
  useEffect(() => {
    const el = logContainerRef.current;
    if (autoScroll && el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll]);

  const handleLogScroll = () => {
    const el = logContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    // Pause auto-scroll when the user scrolls up; resume when back near bottom.
    setAutoScroll(nearBottom);
  };

  // Screen-reader announcement for progress / completion.
  const announcement = useMemo(() => {
    if (!testRun) return "";
    if (isRunning) {
      const current = testRun.progress?.currentProtocol;
      return `Benchmark running. ${completed} of ${total} complete.${
        current ? ` Currently testing ${current}.` : ""
      }`;
    }
    if (testRun.status === "completed") return "Benchmark complete. Results are ready.";
    if (testRun.status === "failed") return "Benchmark failed.";
    return "";
  }, [testRun, isRunning, completed, total]);

  // ---- states ----
  if (!sessionReady || (isLoading && !testRun)) {
    return (
      <div className="container live-page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading test progress…</p>
        </div>
      </div>
    );
  }

  if (!testRunId) {
    return (
      <div className="container live-page">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📡</div>
          <h2>No test selected</h2>
          <p>Start a benchmark from configuration, or pick one from history.</p>
          <div className="state-actions">
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Configure a benchmark
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/history")}>
              Browse history
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && hasLoaded && !testRun) {
    return (
      <div className="container live-page">
        <div className="error-state">
          <div className="empty-icon" aria-hidden="true">🔍</div>
          <h2>Test run not found</h2>
          <p>This run may have been removed.</p>
          <div className="state-actions">
            {latestTestRunId && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  clearActiveTestRun();
                  refreshSession();
                  navigate(`/live?testRunId=${latestTestRunId}`);
                }}
              >
                View latest
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate("/history")}>
              Browse history
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container live-page">
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      <header className="live-header">
        <div>
          <h1>Live progress</h1>
          <div className="live-subhead">
            <span className="live-name">
              {testRun.configuration?.testName || `Test ${testRunId.slice(0, 8)}`}
            </span>
            <span className={`status-badge ${testRun.status}`}>
              {STATUS_LABEL[testRun.status] || "Unknown"}
            </span>
            <span className={`badge ${mode === "live" ? "badge-warning" : "badge-primary"}`}>
              {mode === "live" ? "Live" : "Simulated"}
            </span>
          </div>
        </div>
        <button
          className={`btn ${testRun.status === "completed" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => navigate(`/results?testRunId=${testRunId}`)}
        >
          {testRun.status === "completed" ? "View results →" : "Results & dashboard"}
        </button>
      </header>

      {/* Overall progress */}
      <section className="card card-pad progress-card">
        <div className="progress-top">
          <h2>Overall progress</h2>
          <span className="progress-percent">{percent}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall benchmark progress"
        >
          <div className={`progress-fill ${isRunning ? "animated" : ""}`} style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-meta">
          <span>{completed} of {total} benchmarks</span>
          {testRun.progress?.currentProtocol && isRunning && (
            <span>
              Testing <strong>{testRun.progress.currentProtocol}</strong>
              {testRun.progress.currentScenario && ` · ${testRun.progress.currentScenario}`}
            </span>
          )}
          {testRun.startTime && (
            <span>Started {new Date(testRun.startTime).toLocaleTimeString()}</span>
          )}
        </div>
      </section>

      {testRun.status === "failed" && (
        <div className="alert alert-danger">
          <span className="alert-icon" aria-hidden="true">⚠</span>
          <span>{testRun.error || "The benchmark failed to complete."}</span>
        </div>
      )}

      {/* Protocol status */}
      <section className="results-block">
        <h2 className="section-heading">Protocol status</h2>
        <div className="protocol-status-grid">
          {protocols.map((protocol, i) => {
            const status = protocolStatus(protocol, {
              resultsByProtocol,
              scenarioCount,
              testRun
            });
            const list = resultsByProtocol[protocol] || [];
            const latest = list[list.length - 1]?.metrics;
            const failed = latest && isResultFailed(latest);
            const logsForP = logsByProtocol[protocol] || [];
            const lastLog = logsForP[logsForP.length - 1];
            return (
              <div key={protocol} className={`protocol-status-card ${status}`}>
                <div className="psc-head">
                  <span className="protocol-chip">
                    <span className="protocol-dot" style={{ background: protocolColor(protocol, i) }} />
                    {protocol}
                  </span>
                  <span className={`status-badge ${status}`}>{STATUS_LABEL[status]}</span>
                </div>
                {latest && !failed ? (
                  <dl className="psc-metrics">
                    <div><dt>Latency</dt><dd>{formatMetricValue("latency", latest.latency)}</dd></div>
                    <div><dt>Reliability</dt><dd>{formatMetricValue("reliability", latest.reliability)}</dd></div>
                    <div><dt>Throughput</dt><dd>{formatMetricValue("throughput", latest.throughput)}</dd></div>
                  </dl>
                ) : failed ? (
                  <p className="psc-note danger">{latest.error || "No data returned"}</p>
                ) : (
                  <p className="psc-note">
                    {status === "running" ? "Benchmarking…" : "Waiting to start"}
                  </p>
                )}
                <div className="psc-foot">
                  <span>{list.length}/{scenarioCount || "?"} scenarios</span>
                  {lastLog && <span className="psc-lastlog">{logType(lastLog.type).icon} {lastLog.message}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live charts — only once real data exists */}
      {results.length > 0 && (
        <section className="results-block">
          <h2 className="section-heading">Live metrics</h2>
          <div className="live-charts">
            <div className="chart-block">
              <h3 className="chart-heading">Normalised comparison</h3>
              <ProtocolComparisonChart results={results} />
            </div>
            <div className="chart-block">
              <h3 className="chart-heading">Latency by scenario</h3>
              <LatencyTrendChart results={results} />
            </div>
          </div>
        </section>
      )}

      {/* Execution log */}
      <section className="results-block">
        <div className="log-toolbar">
          <h2 className="section-heading">Execution log</h2>
          <div className="log-controls">
            <div className="segmented log-filter" role="group" aria-label="Filter log entries">
              {LOG_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="auto-scroll">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
          </div>
        </div>

        <div className="log-container" ref={logContainerRef} onScroll={handleLogScroll}>
          {filteredLogs.length === 0 ? (
            <div className="log-empty">
              <p>{logs.length === 0 ? "Waiting for the first log entry…" : "No entries match this filter."}</p>
            </div>
          ) : (
            <ul className="log-list">
              {filteredLogs.map((log, index) => {
                const meta = logType(log.type);
                return (
                  <li key={log._id || index} className={`log-entry tone-${meta.tone}`}>
                    <span className="log-icon" aria-hidden="true">{meta.icon}</span>
                    <div className="log-body">
                      <div className="log-line">
                        <span className={`log-tag tone-${meta.tone}`}>{meta.label}</span>
                        {log.protocol && <span className="log-proto">{log.protocol}</span>}
                        <time className="log-time">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </time>
                      </div>
                      <p className="log-message">{log.message}</p>
                      {log.formula && <code className="log-formula">{log.formula}</code>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {!autoScroll && filteredLogs.length > 0 && (
          <button
            className="btn btn-secondary btn-sm jump-latest"
            onClick={() => setAutoScroll(true)}
          >
            ↓ Jump to latest
          </button>
        )}
      </section>
    </div>
  );
}

export default LiveProgressPage;
