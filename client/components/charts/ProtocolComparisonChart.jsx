// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function ProtocolComparisonChart({ results }) {
  if (!results || results.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        No comparison data available
      </div>
    );
  }

  // Aggregate metrics by protocol
  const protocolMetrics = {};

  results.forEach((result) => {
    if (!result.protocol) return;

    if (!protocolMetrics[result.protocol]) {
      protocolMetrics[result.protocol] = {
        latency: [],
        throughput: [],
        reliability: [],
        jitter: []
      };
    }

    if (result.metrics) {
      // Only push valid numbers
      if (
        typeof result.metrics.latency === "number" &&
        !isNaN(result.metrics.latency) &&
        result.metrics.latency >= 0
      ) {
        protocolMetrics[result.protocol].latency.push(result.metrics.latency);
      }
      if (
        typeof result.metrics.throughput === "number" &&
        !isNaN(result.metrics.throughput) &&
        result.metrics.throughput >= 0
      ) {
        protocolMetrics[result.protocol].throughput.push(
          result.metrics.throughput
        );
      }
      if (
        typeof result.metrics.reliability === "number" &&
        !isNaN(result.metrics.reliability) &&
        result.metrics.reliability >= 0
      ) {
        protocolMetrics[result.protocol].reliability.push(
          result.metrics.reliability
        );
      }
      if (
        typeof result.metrics.jitter === "number" &&
        !isNaN(result.metrics.jitter) &&
        result.metrics.jitter >= 0
      ) {
        protocolMetrics[result.protocol].jitter.push(result.metrics.jitter);
      }
    }
  });

  const protocols = Object.keys(protocolMetrics);
  const labels = [
    "Latency (ms)",
    "Throughput (kbps)",
    "Reliability (%)",
    "Jitter (ms)"
  ];

  const datasets = protocols.map((protocol, index) => {
    const colors = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];
    const color = colors[index % colors.length];

    const latency =
      protocolMetrics[protocol].latency.length > 0
        ? protocolMetrics[protocol].latency.reduce((a, b) => a + b, 0) /
          protocolMetrics[protocol].latency.length
        : 0;
    const throughput =
      protocolMetrics[protocol].throughput.length > 0
        ? protocolMetrics[protocol].throughput.reduce((a, b) => a + b, 0) /
          protocolMetrics[protocol].throughput.length /
          1000
        : 0;
    const reliability =
      protocolMetrics[protocol].reliability.length > 0
        ? protocolMetrics[protocol].reliability.reduce((a, b) => a + b, 0) /
          protocolMetrics[protocol].reliability.length
        : 0;
    const jitter =
      protocolMetrics[protocol].jitter.length > 0
        ? protocolMetrics[protocol].jitter.reduce((a, b) => a + b, 0) /
          protocolMetrics[protocol].jitter.length
        : 0;

    return {
      label: protocol,
      data: [latency, throughput, reliability, jitter],
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1
    };
  });

  const data = {
    labels,
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
        text: "Protocol Performance Comparison"
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Bar data={data} options={options} />;
}

export default ProtocolComparisonChart;
