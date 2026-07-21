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
  formatMetricValue
} from "../../../imports/shared/metrics";
import { useChartTheme } from "../../hooks/useChartTheme";
import { legendConfig, tooltipConfig, linearAxis, categoryAxis } from "./chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Latency per scenario, grouped by protocol. Scenarios are discrete conditions
 * (not points in time), so this is a grouped bar chart — never a line that
 * fabricates a trend from a single data point.
 */
function LatencyTrendChart({ results }) {
  const theme = useChartTheme();
  const comparison = useMemo(() => buildProtocolComparison(results), [results]);

  const active = comparison.protocols.filter((p) => !p.failed);
  const scenarios = comparison.scenarios;

  if (active.length === 0 || scenarios.length === 0) {
    return <div className="chart-empty">No latency data yet.</div>;
  }

  const data = {
    labels: scenarios,
    datasets: active.map((p) => ({
      label: p.name,
      data: scenarios.map((s) => comparison.latencyByScenario[p.name]?.[s] ?? null),
      backgroundColor: p.color,
      borderColor: p.color,
      borderRadius: 4,
      maxBarThickness: 40
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendConfig(theme),
      tooltip: tooltipConfig(theme, {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${formatMetricValue("latency", ctx.parsed.y)}`
        }
      })
    },
    scales: {
      y: linearAxis(theme, { title: "Latency (ms) — lower is better" }),
      x: categoryAxis(theme, {
        title: scenarios.length === 1 ? undefined : "Scenario"
      })
    }
  };

  return (
    <div
      className="chart-canvas"
      role="img"
      aria-label={`Bar chart of latency in milliseconds per scenario (lower is better) for ${active
        .map((p) => p.name)
        .join(", ")}.`}
    >
      <Bar data={data} options={options} />
    </div>
  );
}

export default LatencyTrendChart;
