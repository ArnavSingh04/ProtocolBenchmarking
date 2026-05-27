// Chatgpt by openAI was used to assist in the writing the code for the following file
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import ProtocolComparisonChart from "../components/charts/ProtocolComparisonChart";
import LatencyTrendChart from "../components/charts/LatencyTrendChart";
import { useRunData } from "../hooks/useRunData";

function LiveProgressPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTestRunId, setCurrentTestRunId } = useTestRunContext();
  const urlTestRunId = searchParams.get("testRunId");
  const testRunId = urlTestRunId || currentTestRunId;
  const [autoScroll, setAutoScroll] = useState(true);

  const { testRun, results, logs, isLoading, hasLoaded } = useRunData(
    testRunId,
    true
  );

  useEffect(() => {
    if (urlTestRunId && urlTestRunId !== currentTestRunId) {
      setCurrentTestRunId(urlTestRunId);
    }
  }, [urlTestRunId, currentTestRunId, setCurrentTestRunId]);

  // Auto-scroll to bottom of logs
  const logContainerRef = useRef(null);
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!testRunId) {
    return (
      <div className="live-progress-page">
        <div className="error-message">
          <h2>No Test Run Selected</h2>
          <p>Please start a test from the Configuration page.</p>
          <button onClick={() => navigate("/")}>Go to Configuration</button>
        </div>
      </div>
    );
  }

  if (isLoading && !testRun) {
    return (
      <div className="live-progress-page">
        <div className="loading">Loading test progress...</div>
      </div>
    );
  }

  if (!isLoading && hasLoaded && !testRun) {
    return (
      <div className="live-progress-page">
        <div className="error-message">
          <h2>Test Run Not Found</h2>
          <p>
            This test run ID may be old or expired (especially after restarting
            the dev server in local in-memory mode).
          </p>
          <button
            onClick={() => {
              setCurrentTestRunId(null);
              navigate("/");
            }}
          >
            Start New Test
          </button>
        </div>
      </div>
    );
  }

  const isRunning = testRun?.status === "running";
  const protocols = testRun?.protocols || [];
  const scenarios = testRun?.scenarios || [];

  // Group logs by protocol
  const logsByProtocol = {};
  logs.forEach((log) => {
    if (log.protocol) {
      if (!logsByProtocol[log.protocol]) {
        logsByProtocol[log.protocol] = [];
      }
      logsByProtocol[log.protocol].push(log);
    }
  });

  // Group results by protocol
  const resultsByProtocol = {};
  results.forEach((result) => {
    if (!resultsByProtocol[result.protocol]) {
      resultsByProtocol[result.protocol] = [];
    }
    resultsByProtocol[result.protocol].push(result);
  });

  // Calculate current metrics
  const getCurrentMetrics = (protocol) => {
    const protocolResults = resultsByProtocol[protocol] || [];
    if (protocolResults.length === 0) return null;

    const allMetrics = protocolResults
      .map((r) => r.metrics || {})
      .filter((m) => Object.keys(m).length > 0);
    if (allMetrics.length === 0) return null;

    // Calculate averages - include zeros if they exist, but prefer non-zero values
    const latencyValues = allMetrics
      .map((m) => m.latency || 0)
      .filter((v) => !isNaN(v) && isFinite(v));
    const reliabilityValues = allMetrics
      .map((m) => m.reliability || 0)
      .filter((v) => !isNaN(v) && isFinite(v));
    const throughputValues = allMetrics
      .map((m) => m.throughput || 0)
      .filter((v) => !isNaN(v) && isFinite(v));

    // Use the latest result's metrics if available, or average
    const latestMetrics = allMetrics[allMetrics.length - 1];

    return {
      latency:
        latestMetrics?.latency ??
        (latencyValues.length > 0
          ? latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length
          : 0),
      jitter: latestMetrics?.jitter ?? 0,
      reliability:
        latestMetrics?.reliability ??
        (reliabilityValues.length > 0
          ? reliabilityValues.reduce((a, b) => a + b, 0) /
            reliabilityValues.length
          : 0),
      throughput:
        latestMetrics?.throughput ??
        (throughputValues.length > 0
          ? throughputValues.reduce((a, b) => a + b, 0) /
            throughputValues.length
          : 0)
    };
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "setup":
        return "⚙️";
      case "connect":
        return "🔌";
      case "send":
        return "📤";
      case "receive":
        return "📥";
      case "calculate":
        return "📊";
      case "complete":
        return "✅";
      default:
        return "📝";
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case "setup":
        return "#667eea";
      case "connect":
        return "#4facfe";
      case "send":
        return "#f093fb";
      case "receive":
        return "#764ba2";
      case "calculate":
        return "#43e97b";
      case "complete":
        return "#28a745";
      default:
        return "#666";
    }
  };

  return (
    <div className="live-progress-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Live Test Progress</h1>
          {testRun && (
            <div className="test-info">
              <span className="test-name">
                {testRun.configuration?.testName ||
                  `Test ${testRunId.substring(0, 8)}`}
              </span>
              <span className={`status-badge ${testRun.status}`}>
                {testRun.status === "running"
                  ? "🟢 Running"
                  : testRun.status === "completed"
                  ? "✅ Completed"
                  : testRun.status === "failed"
                  ? "❌ Failed"
                  : "⏸️ Unknown"}
              </span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            className="action-btn"
            onClick={() => navigate(`/dashboard?testRunId=${testRunId}`)}
          >
            Dashboard
          </button>
          {testRun?.status === "completed" && (
            <button
              className="action-btn primary"
              onClick={() => navigate(`/results?testRunId=${testRunId}`)}
            >
              View Results
            </button>
          )}
        </div>
      </div>

      {testRun?.progress && (
        <div className="overall-progress">
          <div className="progress-header">
            <h2>Overall Progress</h2>
            <span className="progress-percent">
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
          <div className="progress-bar-large">
            <div
              className="progress-fill-large"
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
          <div className="progress-details">
            <div className="progress-item">
              <strong>Test:</strong> {testRun.progress.completed || 0} of{" "}
              {testRun.progress.total || 0}
            </div>
            {testRun.progress.currentProtocol && (
              <div className="progress-item">
                <strong>Current:</strong> {testRun.progress.currentProtocol}
                {testRun.progress.currentScenario &&
                  ` - ${testRun.progress.currentScenario}`}
              </div>
            )}
            {testRun.startTime && (
              <div className="progress-item">
                <strong>Started:</strong>{" "}
                {new Date(testRun.startTime).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="progress-grid">
        {/* Protocol Status Cards */}
        <div className="protocol-status-section">
          <h2>Protocol Status</h2>
          <div className="protocol-cards">
            {protocols.map((protocol) => {
              const protocolLogs = logsByProtocol[protocol] || [];
              const lastLog = protocolLogs[protocolLogs.length - 1];
              const metrics = getCurrentMetrics(protocol);
              const isActive = testRun?.progress?.currentProtocol === protocol;

              return (
                <div
                  key={protocol}
                  className={`protocol-card ${isActive ? "active" : ""}`}
                >
                  <div className="protocol-card-header">
                    <h3>{protocol}</h3>
                    {isActive && <span className="active-badge">ACTIVE</span>}
                  </div>
                  {metrics ? (
                    <div className="protocol-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Latency:</span>
                        <span className="metric-value">
                          {metrics.latency.toFixed(2)}ms
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Reliability:</span>
                        <span className="metric-value">
                          {metrics.reliability.toFixed(1)}%
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Throughput:</span>
                        <span className="metric-value">
                          {(metrics.throughput / 1000).toFixed(2)}kbps
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="protocol-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Status:</span>
                        <span className="metric-value">No results yet</span>
                      </div>
                    </div>
                  )}
                  {lastLog && (
                    <div className="last-action">
                      <span className="action-icon">
                        {getLogIcon(lastLog.type)}
                      </span>
                      <span className="action-text">{lastLog.message}</span>
                    </div>
                  )}
                  <div className="log-count">
                    {protocolLogs.length} log entries
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Metrics Charts */}
        {results.length > 0 && (
          <div className="charts-section">
            <h2>Live Metrics</h2>
            <div className="chart-container">
              <ProtocolComparisonChart results={results} />
            </div>
            <div className="chart-container">
              <LatencyTrendChart results={results} />
            </div>
          </div>
        )}
      </div>

      {/* Detailed Execution Log */}
      <div className="execution-log-section">
        <div className="log-header">
          <h2>Detailed Execution Log</h2>
          <div className="log-controls">
            <label className="auto-scroll-label">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
            <button
              className="clear-btn"
              onClick={() => {
                if (logContainerRef.current) {
                  logContainerRef.current.scrollTop = 0;
                }
              }}
            >
              Scroll to Top
            </button>
          </div>
        </div>
        <div className="log-container" ref={logContainerRef}>
          {logs.length === 0 ? (
            <div className="log-empty">
              <p>Waiting for test logs...</p>
              <p className="log-empty-hint">
                Test execution details will appear here as tests run.
              </p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="log-entry-detailed"
                style={{ borderLeftColor: getLogColor(log.type) }}
              >
                <div className="log-entry-header">
                  <div className="log-icon-large">{getLogIcon(log.type)}</div>
                  <div className="log-meta">
                    <span
                      className="log-type-badge"
                      style={{
                        backgroundColor: getLogColor(log.type) + "20",
                        color: getLogColor(log.type)
                      }}
                    >
                      {log.type.toUpperCase()}
                    </span>
                    {log.protocol && (
                      <span className="log-protocol">
                        Protocol: {log.protocol}
                      </span>
                    )}
                    <span className="log-timestamp">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="log-message-detailed">{log.message}</div>

                {log.formula && (
                  <div className="log-formula-box">
                    <strong className="formula-title">
                      📐 Calculation Formula:
                    </strong>
                    <code className="formula-code">{log.formula}</code>
                  </div>
                )}

                {log.networkConditions && (
                  <div className="log-network-conditions">
                    <strong>Network Conditions Applied:</strong>
                    <ul>
                      {log.networkConditions.latency && (
                        <li>Latency: {log.networkConditions.latency}ms</li>
                      )}
                      {log.networkConditions.packetLoss !== undefined && (
                        <li>
                          Packet Loss: {log.networkConditions.packetLoss}%
                        </li>
                      )}
                      {log.networkConditions.jitter && (
                        <li>Jitter: {log.networkConditions.jitter}ms</li>
                      )}
                      {log.networkConditions.unstable && (
                        <li>Unstable Network: Yes</li>
                      )}
                    </ul>
                  </div>
                )}

                {log.metrics && typeof log.metrics === "object" && (
                  <div className="log-metrics-detailed">
                    <strong>Calculated Metrics:</strong>
                    <div className="metrics-grid">
                      {log.metrics.latency !== undefined && (
                        <div className="metric-box">
                          <span className="metric-name">Latency</span>
                          <span className="metric-number">
                            {log.metrics.latency.toFixed(2)}ms
                          </span>
                        </div>
                      )}
                      {log.metrics.reliability !== undefined && (
                        <div className="metric-box">
                          <span className="metric-name">Reliability</span>
                          <span className="metric-number">
                            {log.metrics.reliability.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {log.metrics.throughput !== undefined && (
                        <div className="metric-box">
                          <span className="metric-name">Throughput</span>
                          <span className="metric-number">
                            {(log.metrics.throughput / 1000).toFixed(2)}kbps
                          </span>
                        </div>
                      )}
                      {log.metrics.jitter !== undefined && (
                        <div className="metric-box">
                          <span className="metric-name">Jitter</span>
                          <span className="metric-number">
                            {log.metrics.jitter.toFixed(2)}ms
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(log.sentCount !== undefined ||
                  log.receivedCount !== undefined) && (
                  <div className="log-message-stats">
                    {log.sentCount !== undefined && (
                      <span className="stat-item">
                        <strong>Sent:</strong> {log.sentCount}
                        {log.messageCount && ` / ${log.messageCount}`}
                      </span>
                    )}
                    {log.receivedCount !== undefined && (
                      <span className="stat-item">
                        <strong>Received:</strong> {log.receivedCount}
                      </span>
                    )}
                    {log.progress && (
                      <span className="stat-item">
                        <strong>Progress:</strong> {log.progress}
                      </span>
                    )}
                    {log.avgLatency !== undefined && (
                      <span className="stat-item">
                        <strong>Avg Latency:</strong>{" "}
                        {log.avgLatency.toFixed(2)}ms
                      </span>
                    )}
                  </div>
                )}

                {log.broker && (
                  <div className="log-detail">
                    <strong>Broker URL:</strong> {log.broker}
                  </div>
                )}

                {log.topic && (
                  <div className="log-detail">
                    <strong>Topic:</strong> <code>{log.topic}</code>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Test Configuration Summary */}
      {testRun && (
        <div className="config-summary">
          <h2>Test Configuration</h2>
          <div className="config-grid">
            <div className="config-item">
              <strong>Protocols:</strong>
              <div className="protocol-tags">
                {protocols.map((p) => (
                  <span key={p} className="protocol-tag">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="config-item">
              <strong>Scenarios:</strong>
              <div className="scenario-tags">
                {scenarios.map((s, i) => (
                  <span key={i} className="scenario-tag">
                    {s.name || s}
                  </span>
                ))}
              </div>
            </div>
            <div className="config-item">
              <strong>Start Time:</strong>
              <span>
                {testRun.startTime
                  ? new Date(testRun.startTime).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            {testRun.endTime && (
              <div className="config-item">
                <strong>End Time:</strong>
                <span>{new Date(testRun.endTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveProgressPage;
