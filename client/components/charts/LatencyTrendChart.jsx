// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function LatencyTrendChart({ results }) {
  if (!results || results.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        No latency data available
      </div>
    );
  }

  // Group results by protocol, ordered by timestamp
  const protocolData = {};
  const allTimestamps = [];

  // Sort results by timestamp
  const sortedResults = [...results].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  sortedResults.forEach((result) => {
    if (!result.protocol) return;

    if (!protocolData[result.protocol]) {
      protocolData[result.protocol] = [];
    }

    const latency = result.metrics?.latency;
    if (typeof latency === "number" && !isNaN(latency) && latency >= 0) {
      protocolData[result.protocol].push(latency);
    } else {
      protocolData[result.protocol].push(null);
    }
  });

  // Create labels based on number of data points
  const maxDataPoints = Math.max(
    ...Object.values(protocolData).map((arr) => arr.length),
    1
  );
  const timeLabels = Array.from(
    { length: maxDataPoints },
    (_, i) => `Test ${i + 1}`
  );

  const protocols = Object.keys(protocolData);
  const colors = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];

  // Ensure all datasets have the same length
  const datasets = protocols.map((protocol, index) => {
    const data = protocolData[protocol];
    // Pad with nulls if needed
    while (data.length < maxDataPoints) {
      data.push(null);
    }

    return {
      label: protocol,
      data: data.slice(0, maxDataPoints),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + "20",
      tension: 0.4,
      fill: false,
      spanGaps: true // Connect across null values
    };
  });

  const data = {
    labels: timeLabels,
    datasets
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      },
      title: {
        display: true,
        text: "Latency Over Time"
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Latency (ms)"
        }
      },
      x: {
        title: {
          display: true,
          text: "Time"
        }
      }
    }
  };

  return <Line data={data} options={options} />;
}

export default LatencyTrendChart;
