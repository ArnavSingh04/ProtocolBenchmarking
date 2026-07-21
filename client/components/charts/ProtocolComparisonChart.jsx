import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  buildProtocolComparison,
  METRICS,
  METRIC_KEYS,
  formatMetricValue
} from "../../../imports/shared/metrics";
import { useChartTheme } from "../../hooks/useChartTheme";
import { legendConfig, tooltipConfig, linearAxis, categoryAxis } from "./chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Normalised attribute comparison. Every value is on the SAME 0–100 scale
 * ("higher is better"), so different metrics with incompatible units can be
 * shown on one axis honestly. Raw values live in the tooltip and the table.
 */
function ProtocolComparisonChart({ results }) {
  const theme = useChartTheme();
  const comparison = useMemo(() => buildProtocolComparison(results), [results]);

  const active = comparison.protocols.filter((p) => !p.failed);
  if (active.length === 0) {
    return <div className="chart-empty">No comparable protocol data yet.</div>;
  }

  const labels = METRIC_KEYS.map((k) => METRICS[k].label);

  const data = {
    labels,
    datasets: active.map((p) => ({
      label: p.name,
      data: METRIC_KEYS.map((k) => p.normalized[k] ?? 0),
      backgroundColor: p.color,
      borderColor: p.color,
      borderWidth: 0,
      borderRadius: 4,
      maxBarThickness: 26,
      // stash raw values for the tooltip
      _raw: METRIC_KEYS.map((k) => p.metrics[k])
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: legendConfig(theme),
      tooltip: tooltipConfig(theme, {
        callbacks: {
          label: (ctx) => {
            const key = METRIC_KEYS[ctx.dataIndex];
            const raw = ctx.dataset._raw?.[ctx.dataIndex];
            const rawText = formatMetricValue(key, raw);
            return `${ctx.dataset.label}: ${ctx.parsed.y}/100  (${rawText})`;
          }
        }
      })
    },
    scales: {
      y: linearAxis(theme, { title: "Normalised score (higher is better)", max: 100 }),
      x: categoryAxis(theme)
    }
  };

  return (
    <div
      className="chart-canvas"
      role="img"
      aria-label={`Grouped bar chart of normalised attribute scores (0–100, higher is better) for ${active
        .map((p) => p.name)
        .join(", ")}. Exact values are in the metrics table.`}
    >
      <Bar data={data} options={options} />
    </div>
  );
}

export default ProtocolComparisonChart;
