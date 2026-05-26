// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import { useRunData } from "../hooks/useRunData";

function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTestRunId } = useTestRunContext();
  const urlTestRunId = searchParams.get("testRunId");
  const testRunId = urlTestRunId || currentTestRunId;

  const { testRun, results, isLoading } = useRunData(testRunId, false);

  const handleDownloadReport = () => {
    if (!testRun) return;

    const report = {
      testRun: {
        id: testRun._id,
        testName: testRun.configuration?.testName || "Untitled Test",
        startTime: testRun.startTime,
        endTime: testRun.endTime,
        status: testRun.status,
        protocols: testRun.protocols,
        scenarios: testRun.scenarios
      },
      results: testRun.results,
      detailedResults: results,
      attributes: testRun.attributes
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `protocol-test-report-${testRun._id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!testRunId) {
    return (
      <div className="results-page">
        <div className="error-message">
          <h2>No Test Run Selected</h2>
          <button onClick={() => navigate("/")}>Go to Configuration</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="results-page">
        <div className="loading">Loading test results...</div>
      </div>
    );
  }

  if (!testRun) {
    return (
      <div className="results-page">
        <div className="error-message">
          <h2>Test Run Not Found</h2>
          <button onClick={() => navigate("/")}>Go to Configuration</button>
        </div>
      </div>
    );
  }

  const sortedResults = testRun.results
    ? Object.entries(testRun.results).sort(
        (a, b) => (b[1]?.score || 0) - (a[1]?.score || 0)
      )
    : [];

  if (sortedResults.length === 0 && testRun.status === "completed") {
    return (
      <div className="results-page">
        <div className="error-message">
          <h2>No Results Available</h2>
          <p>The tests completed but no fitness scores were calculated.</p>
          <p>Check the server console for any errors.</p>
          <button onClick={() => navigate("/")}>Go to Configuration</button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <h1>Test Results</h1>
        <button className="download-btn" onClick={handleDownloadReport}>
          Download Report
        </button>
      </div>

      <div className="results-content">
        <div className="test-info">
          <h2>Test Configuration</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Test Name:</span>
              <span className="info-value">
                {testRun.configuration?.testName || "Untitled"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Start Time:</span>
              <span className="info-value">
                {new Date(testRun.startTime).toLocaleString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">End Time:</span>
              <span className="info-value">
                {testRun.endTime
                  ? new Date(testRun.endTime).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Protocols:</span>
              <span className="info-value">
                {testRun.protocols?.join(", ") || "N/A"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Scenarios:</span>
              <span className="info-value">
                {testRun.scenarios?.map((s) => s.name || s).join(", ") || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="fitness-scores-section">
          <h2>Fitness Scores & Recommendations</h2>
          <div className="rankings">
            {sortedResults.map(([protocol, data], index) => (
              <div key={protocol} className="ranking-card">
                <div className="rank-badge">#{index + 1}</div>
                <div className="ranking-content">
                  <h3>{protocol}</h3>
                  <div className="score-display">
                    <span className="score-label">Fitness Score:</span>
                    <span className="score-value-large">{data.score}/100</span>
                  </div>
                  <div className="recommendation-box">
                    <strong>Recommendation:</strong>
                    <p>{data.recommendation}</p>
                  </div>
                  <div className="key-metrics">
                    <div className="metric">
                      <span className="metric-label">Avg Latency:</span>
                      <span className="metric-value">
                        {data.metrics?.latency
                          ? `${data.metrics.latency.toFixed(2)}ms`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Reliability:</span>
                      <span className="metric-value">
                        {data.metrics?.reliability
                          ? `${data.metrics.reliability.toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Throughput:</span>
                      <span className="metric-value">
                        {data.metrics?.throughput
                          ? `${(data.metrics.throughput / 1000).toFixed(2)}kbps`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard?testRunId=" + testRunId)}
          >
            Back to Dashboard
          </button>
          <button className="new-test-btn" onClick={() => navigate("/")}>
            Run New Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
