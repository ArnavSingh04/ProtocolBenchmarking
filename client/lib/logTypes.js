// Central definition of execution-log entry types: consistent icon, label and
// severity tone across the live view (and any other log renderer).

export const LOG_TYPES = {
  setup: { label: "Setup", icon: "⚙", tone: "neutral" },
  connect: { label: "Connect", icon: "🔌", tone: "info" },
  send: { label: "Send", icon: "↑", tone: "primary" },
  receive: { label: "Receive", icon: "↓", tone: "primary" },
  calculate: { label: "Calculate", icon: "∑", tone: "info" },
  complete: { label: "Complete", icon: "✓", tone: "success" },
  error: { label: "Error", icon: "⚠", tone: "danger" }
};

export function logType(type) {
  return LOG_TYPES[type] || { label: (type || "log").toUpperCase(), icon: "•", tone: "neutral" };
}

// Filter presets for the log viewer.
export const LOG_FILTERS = [
  { id: "all", label: "All", types: null },
  { id: "errors", label: "Errors", types: ["error"] },
  { id: "connection", label: "Connection", types: ["setup", "connect"] },
  { id: "data", label: "Data", types: ["send", "receive", "calculate", "complete"] }
];
