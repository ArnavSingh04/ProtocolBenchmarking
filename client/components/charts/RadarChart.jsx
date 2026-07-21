import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";
import { Radar } from "react-chartjs-2";
import {
  buildProtocolComparison,
  METRICS,
  METRIC_KEYS,
  formatMetricValue
} from "../../../imports/shared/metrics";
import { useChartTheme } from "../../hooks/useChartTheme";
import { legendConfig, tooltipConfig, radialScale } from "./chartTheme";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(m[i], 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Multi-attribute radar of NORMALISED scores (0–100, higher is better on every
 * axis). Lower-is-better metrics like latency are inverted during normalisation
 * so "further out" always means "better".
 */
function RadarChart({ results }) {
  const theme = useChartTheme();
  const comparison = useMemo(() => buildProtocolComparison(results), [results]);

  const active = comparison.protocols.filter((p) => !p.failed);
  if (active.length === 0) {
    return <div className="chart-empty">No attribute data yet.</div>;
  }

  const labels = METRIC_KEYS.map((k) => METRICS[k].label);

  const data = {
    labels,
    datasets: active.map((p) => ({
      label: p.name,
      data: METRIC_KEYS.map((k) => p.normalized[k] ?? 0),
      backgroundColor: hexToRgba(p.color, theme.isDark ? 0.28 : 0.18),
      borderColor: p.color,
      borderWidth: 2,
      pointBackgroundColor: p.color,
      pointBorderColor: theme.surface,
      pointRadius: 3,
      _raw: METRIC_KEYS.map((k) => p.metrics[k])
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendConfig(theme),
      tooltip: tooltipConfig(theme, {
        callbacks: {
          label: (ctx) => {
            const key = METRIC_KEYS[ctx.dataIndex];
            const raw = ctx.dataset._raw?.[ctx.dataIndex];
            return `${ctx.dataset.label}: ${ctx.formattedValue}/100  (${formatMetricValue(
              key,
              raw
            )})`;
          }
        }
      })
    },
    scales: radialScale(theme)
  };

  return (
    <div
      className="chart-canvas radar"
      role="img"
      aria-label={`Radar chart of normalised attribute scores (0–100, further out is better) for ${active
        .map((p) => p.name)
        .join(", ")}. Exact values are in the metrics table.`}
    >
      <Radar data={data} options={options} />
    </div>
  );
}

export default RadarChart;
