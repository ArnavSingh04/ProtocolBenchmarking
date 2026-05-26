// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
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

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function RadarChart({ results, attributes }) {
  // Aggregate metrics by protocol
  const protocolMetrics = {};

  results.forEach((result) => {
    if (!protocolMetrics[result.protocol]) {
      protocolMetrics[result.protocol] = {
        latency: [],
        throughput: [],
        reliability: [],
        jitter: [],
        ordering: [],
        dataIntegrity: [],
        resourceUsage: [],
        securityOverhead: []
      };
    }

    if (result.metrics) {
      Object.keys(result.metrics).forEach((key) => {
        if (
          protocolMetrics[result.protocol][key] &&
          typeof result.metrics[key] === "number"
        ) {
          protocolMetrics[result.protocol][key].push(result.metrics[key]);
        }
      });
    }
  });

  const protocols = Object.keys(protocolMetrics);
  const labels = attributes?.map((a) => a.label) || [
    "Latency",
    "Throughput",
    "Reliability",
    "Jitter",
    "Ordering",
    "Data Integrity",
    "Resource Usage",
    "Security"
  ];

  // Normalize values to 0-100 scale for radar chart
  const normalizeValue = (value, attributeName) => {
    // Find min/max across all protocols
    const allValues = protocols
      .flatMap((p) => protocolMetrics[p][attributeName] || [])
      .filter((v) => typeof v === "number" && !isNaN(v));

    if (allValues.length === 0) return 0;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    if (max === min) return 50;

    // For attributes where lower is better
    if (
      ["latency", "jitter", "resourceUsage", "securityOverhead"].includes(
        attributeName
      )
    ) {
      return 100 - ((value - min) / (max - min)) * 100;
    }

    // For attributes where higher is better
    return ((value - min) / (max - min)) * 100;
  };

  const colors = ["#667eea80", "#764ba280", "#f093fb80", "#4facfe80"];
  const borderColors = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];

  const datasets = protocols.map((protocol, index) => {
    const attributeNames = attributes?.map((a) => a.name) || [
      "latency",
      "throughput",
      "reliability",
      "jitter",
      "ordering",
      "dataIntegrity",
      "resourceUsage",
      "securityOverhead"
    ];

    const data = attributeNames.map((attrName) => {
      const values = protocolMetrics[protocol][attrName] || [];
      if (values.length === 0) return 0;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return normalizeValue(avg, attrName);
    });

    return {
      label: protocol,
      data,
      backgroundColor: colors[index % colors.length],
      borderColor: borderColors[index % borderColors.length],
      borderWidth: 2,
      pointBackgroundColor: borderColors[index % borderColors.length],
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: borderColors[index % borderColors.length]
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
        text: "Multi-Attribute Protocol Comparison"
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  return <Radar data={data} options={options} />;
}

export default RadarChart;
