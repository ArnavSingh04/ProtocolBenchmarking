import React, { useMemo } from "react";
import {
  buildProtocolComparison,
  METRICS,
  METRIC_KEYS,
  LOWER_IS_BETTER,
  metricHeader,
  formatMetricValue
} from "../../imports/shared/metrics";

/**
 * Raw metric comparison as an accessible table. Best value per metric is
 * highlighted (respecting each metric's direction). Failed protocols are shown
 * but clearly marked and never highlighted as "best".
 */
function MetricComparisonTable({ results }) {
  const comparison = useMemo(() => buildProtocolComparison(results), [results]);
  const protocols = comparison.protocols;

  if (protocols.length === 0) {
    return <div className="chart-empty">No metric data yet.</div>;
  }

  const successful = protocols.filter((p) => !p.failed);

  const bestByMetric = {};
  for (const key of METRIC_KEYS) {
    const values = successful
      .map((p) => p.metrics[key])
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (values.length > 0) {
      bestByMetric[key] = LOWER_IS_BETTER.includes(key)
        ? Math.min(...values)
        : Math.max(...values);
    }
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <caption className="visually-hidden">
          Raw measured metrics for each protocol. Best value in each column is
          highlighted.
        </caption>
        <thead>
          <tr>
            <th scope="col">Protocol</th>
            {METRIC_KEYS.map((key) => (
              <th key={key} scope="col" title={METRICS[key].description}>
                {metricHeader(key)}
                <span className="th-dir">
                  {LOWER_IS_BETTER.includes(key) ? "↓ better" : "↑ better"}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {protocols.map((p) => (
            <tr key={p.name} className={p.failed ? "row-failed" : ""}>
              <th scope="row">
                <span className="protocol-chip">
                  <span className="protocol-dot" style={{ background: p.color }} />
                  {p.name}
                </span>
                {p.failed && (
                  <span className="badge badge-danger table-fail-badge">Failed</span>
                )}
              </th>
              {METRIC_KEYS.map((key) => {
                const value = p.metrics[key];
                const isBest =
                  !p.failed &&
                  typeof value === "number" &&
                  bestByMetric[key] !== undefined &&
                  Math.abs(value - bestByMetric[key]) < 1e-9 &&
                  successful.length > 1;
                return (
                  <td key={key} className={isBest ? "best" : ""}>
                    {p.failed ? "—" : formatMetricValue(key, value)}
                    {isBest && (
                      <span className="visually-hidden"> (best)</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MetricComparisonTable;
