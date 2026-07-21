import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import { useEffectiveTestRunId } from "../hooks/useEffectiveTestRunId";
import { useRunData } from "../hooks/useRunData";
import ProtocolComparisonChart from "../components/charts/ProtocolComparisonChart";
import LatencyTrendChart from "../components/charts/LatencyTrendChart";
import RadarChart from "../components/charts/RadarChart";
import MetricComparisonTable from "../components/MetricComparisonTable";
import {
  rankedProtocols,
  protocolColor,
  formatDuration,
  durationBetween,
  METRICS
} from "../../imports/shared/metrics";
import { buildReport, reportFileName } from "../../imports/shared/report";

function StatusBadge({ status }) {
  const map = {
    running: "Running",
    completed: "Completed",
    failed: "Failed"
  };
  return (
    <span className={`status-badge ${status || "unknown"}`}>
      {map[status] || "Unknown"}
    </span>
  );
}

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

  const scores = testRun?.results || {};
  const ranked = useMemo(() => rankedProtocols(scores), [scores]);
  const successful = ranked.filter(([, d]) => !d.failed);
  const failedRanked = ranked.filter(([, d]) => d.failed);
  const winner = successful[0];
  const mode = testRun?.mode || testRun?.configuration?.mode || "simulation";
  const simulated = mode !== "live";
  const singleProtocol = successful.length === 1;

  const handleDownloadReport = () => {
    if (!testRun) return;
    const generatedAt = new Date().toISOString();
    const report = buildReport(testRun, results, { generatedAt });
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = reportFileName(testRun, generatedAt);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---- loading / empty / error states ----
  if (!sessionReady || (isLoading && !testRun)) {
    return (
      <div className="container results-page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading results…</p>
        </div>
      </div>
    );
  }

  if (!testRunId) {
    return (
      <div className="container results-page">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📊</div>
          <h2>No results yet</h2>
          <p>Run a benchmark from the configuration page to see results here.</p>
          <div className="state-actions">
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Configure a benchmark
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testRun && hasLoaded) {
    return (
      <div className="container results-page">
        <div className="error-state">
          <div className="empty-icon" aria-hidden="true">🔍</div>
          <h2>Test run not found</h2>
          <p>This run may have been removed. Open another from history or start a new test.</p>
          <div className="state-actions">
            {latestTestRunId && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  clearActiveTestRun();
                  refreshSession();
                  navigate(`/results?testRunId=${latestTestRunId}`);
                }}
              >
                View latest
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate("/history")}>
              Browse history
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              New test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testRun) {
    return (
      <div className="container results-page">
        <div className="loading">
          <div className="spinner" />
          <p>Connecting to test run…</p>
        </div>
      </div>
    );
  }

  const isRunning = testRun.status === "running";
  const protocols = testRun.protocols || [];
  const scenarios = testRun.scenarios || [];
  const duration = durationBetween(testRun.startTime, testRun.endTime);
  const hasCharts = results.length > 0;

  // Top strengths for the winner (highest weighted normalised attributes).
  const winnerStrengths = winner
    ? Object.entries(winner[1].normalized || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => METRICS[key]?.label || key)
    : [];

  return (
    <div className="container results-page">
      <header className="results-header">
        <div className="results-title">
          <h1>Results</h1>
          <div className="results-badges">
            <StatusBadge status={testRun.status} />
            <span className={`badge ${simulated ? "badge-primary" : "badge-warning"}`}>
              {simulated ? "Simulated" : "Live"}
            </span>
            {isViewingLatest && <span className="badge badge-neutral">Latest run</span>}
            {urlTestRunId && urlTestRunId !== latestTestRunId && (
              <span className="badge badge-neutral">From history</span>
            )}
          </div>
        </div>
        <div className="results-actions">
          {testRun.status === "completed" && successful.length > 0 && (
            <button className="btn btn-secondary" onClick={handleDownloadReport}>
              ⬇ Download report
            </button>
          )}
          {isRunning && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/live?testRunId=${testRunId}`)}
            >
              View live progress
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate("/")}>
            Run new test
          </button>
        </div>
      </header>

      {/* Test configuration summary */}
      <section className="card card-pad config-recap">
        <div className="recap-name">
          <h2>{testRun.configuration?.testName || "Untitled test"}</h2>
        </div>
        <dl className="recap-grid">
          <div>
            <dt>Protocols</dt>
            <dd>
              {protocols.map((p, i) => (
                <span key={p} className="protocol-chip recap-chip">
                  <span className="protocol-dot" style={{ background: protocolColor(p, i) }} />
                  {p}
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt>Scenarios</dt>
            <dd>{scenarios.map((s) => s.name || s).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{testRun.startTime ? new Date(testRun.startTime).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{duration != null ? formatDuration(duration) : isRunning ? "Running…" : "—"}</dd>
          </div>
        </dl>
      </section>

      {isRunning && (
        <div className="alert alert-info">
          <span className="alert-icon" aria-hidden="true">⏳</span>
          <span>
            This benchmark is still running.{" "}
            <button className="link-btn" onClick={() => navigate(`/live?testRunId=${testRunId}`)}>
              Watch live progress
            </button>{" "}
            — results appear here as each protocol completes.
          </span>
        </div>
      )}

      {testRun.status === "failed" && successful.length === 0 && (
        <div className="alert alert-danger">
          <span className="alert-icon" aria-hidden="true">⚠</span>
          <span>
            No protocol produced usable data{testRun.error ? `: ${testRun.error}` : "."}{" "}
            {!simulated && "In live mode this usually means the endpoints were unreachable."}
          </span>
        </div>
      )}

      {/* Winner */}
      {winner && (
        <section className="winner-card card">
          <div className="winner-ribbon">Recommended</div>
          <div className="winner-body">
            <div className="winner-headline">
              <span
                className="winner-dot"
                style={{ background: protocolColor(winner[0]) }}
                aria-hidden="true"
              />
              <div>
                <p className="winner-eyebrow">Best fit for your priorities</p>
                <h2 className="winner-name">{winner[0]}</h2>
              </div>
              <div className="winner-score">
                <span className="winner-score-value">{winner[1].score}</span>
                <span className="winner-score-max">/100</span>
                <span className="winner-score-label">fitness score</span>
              </div>
            </div>
            <p className="winner-reco">{winner[1].recommendation}</p>
            {winnerStrengths.length > 0 && !singleProtocol && (
              <div className="winner-strengths">
                <span className="muted">Strongest on:</span>
                {winnerStrengths.map((label) => (
                  <span key={label} className="badge badge-success">{label}</span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Confidence / caveats */}
      {(singleProtocol || simulated || failedRanked.length > 0) && (successful.length > 0) && (
        <div className="alert alert-warning confidence-note">
          <span className="alert-icon" aria-hidden="true">ⓘ</span>
          <div>
            <strong>How confident should you be?</strong>
            <ul className="confidence-list">
              {simulated && (
                <li>
                  These are <strong>modelled</strong> results from a deterministic
                  simulation, not live network measurements.
                </li>
              )}
              {singleProtocol && (
                <li>
                  Only one protocol produced data, so the fitness score is not a
                  comparison — the raw metrics below are the meaningful output.
                </li>
              )}
              {failedRanked.length > 0 && (
                <li>
                  {failedRanked.map(([n]) => n).join(", ")}{" "}
                  {failedRanked.length > 1 ? "were" : "was"} excluded (no usable
                  data) and cannot be ranked.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Full ranking */}
      {ranked.length > 0 && (
        <section className="ranking-section">
          <h2 className="section-heading">Protocol ranking</h2>
          <ol className="ranking-list">
            {ranked.map(([protocol, data], index) => (
              <li
                key={protocol}
                className={`ranking-row ${data.failed ? "failed" : ""}`}
              >
                <span className="rank-num">{data.failed ? "—" : `#${index + 1}`}</span>
                <span className="protocol-chip">
                  <span className="protocol-dot" style={{ background: protocolColor(protocol, index) }} />
                  {protocol}
                </span>
                <div className="rank-score">
                  {data.failed ? (
                    <span className="badge badge-danger">Failed{data.error ? `: ${data.error}` : ""}</span>
                  ) : (
                    <>
                      <div className="score-bar" aria-hidden="true">
                        <span style={{ width: `${data.score}%`, background: protocolColor(protocol, index) }} />
                      </div>
                      <span className="score-num">{data.score}/100</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <details className="score-explainer">
            <summary>How is the fitness score calculated?</summary>
            <p>
              For each protocol we average its metrics across every scenario, then
              normalise each metric to a 0–100 scale across the protocols being
              compared (inverting metrics where lower is better, like latency).
              Each normalised value is multiplied by the weight you assigned to
              that attribute, and the weighted average becomes the fitness score.
              Protocols that produced no usable data are excluded so they can
              never appear as a false winner.
            </p>
          </details>
        </section>
      )}

      {/* Raw metric comparison */}
      {hasCharts && (
        <section className="results-block">
          <h2 className="section-heading">Measured metrics</h2>
          <p className="section-description">
            Raw values per protocol (averaged across scenarios). The best value in
            each column is highlighted.
          </p>
          <MetricComparisonTable results={results} />
        </section>
      )}

      {/* Charts */}
      {hasCharts ? (
        <div className="charts-grid">
          <section className="results-block chart-block">
            <h3 className="chart-heading">Normalised comparison</h3>
            <p className="section-description">
              Every attribute on one 0–100 scale (higher is better), so
              incompatible units can be compared fairly.
            </p>
            <ProtocolComparisonChart results={results} />
          </section>

          <section className="results-block chart-block">
            <h3 className="chart-heading">Attribute profile</h3>
            <p className="section-description">
              Each protocol's shape across all attributes — further out is better.
            </p>
            <RadarChart results={results} />
          </section>

          <section className="results-block chart-block full-span">
            <h3 className="chart-heading">Latency by scenario</h3>
            <p className="section-description">
              Latency for each protocol under each scenario (lower is better).
            </p>
            <LatencyTrendChart results={results} />
          </section>
        </div>
      ) : (
        testRun.status === "completed" && (
          <div className="alert alert-warning">
            <span className="alert-icon" aria-hidden="true">⚠</span>
            <span>The run completed but no detailed metrics were recorded.</span>
          </div>
        )
      )}

      <div className="results-footer-actions">
        <button className="btn btn-secondary" onClick={() => navigate("/history")}>
          View history
        </button>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Run another test
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
