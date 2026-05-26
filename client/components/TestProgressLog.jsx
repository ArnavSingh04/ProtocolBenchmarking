// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import { useRunData } from "../hooks/useRunData";

function TestProgressLog({ testRunId }) {
  const { logs } = useRunData(testRunId, true);

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
    <div className="test-progress-log">
      <h4>Test Execution Log</h4>
      <div className="log-container">
        {logs.length === 0 ? (
          <div className="log-empty">Waiting for test logs...</div>
        ) : (
          logs.slice(-20).map((log, index) => (
            <div
              key={index}
              className="log-entry"
              style={{ borderLeftColor: getLogColor(log.type) }}
            >
              <div className="log-header">
                <span className="log-icon">{getLogIcon(log.type)}</span>
                <span className="log-type">{log.type.toUpperCase()}</span>
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="log-message">{log.message}</div>
              {log.formula && (
                <div className="log-formula">
                  <strong>Formula:</strong> {log.formula}
                </div>
              )}
              {log.metrics && (
                <div className="log-metrics">
                  {log.protocol && <span>Protocol: {log.protocol}</span>}
                  {log.receivedCount !== undefined && (
                    <span>Received: {log.receivedCount}</span>
                  )}
                  {log.sentCount !== undefined && (
                    <span>Sent: {log.sentCount}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TestProgressLog;
