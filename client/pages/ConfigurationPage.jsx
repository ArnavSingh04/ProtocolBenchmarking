// Chatgpt by openAI was used to assist in the writing the code for the following file
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import AttributeSelector from "../components/AttributeSelector";
import ProtocolSelector from "../components/ProtocolSelector";
import ScenarioSelector from "../components/ScenarioSelector";
import { startRun } from "../lib/api";

const QUALITY_ATTRIBUTES = [
  {
    name: "latency",
    label: "Latency",
    description: "Time delay in message transmission"
  },
  {
    name: "reliability",
    label: "Reliability",
    description: "Message delivery success rate"
  },
  {
    name: "throughput",
    label: "Throughput",
    description: "Data transfer rate"
  },
  { name: "jitter", label: "Jitter", description: "Variation in latency" },
  {
    name: "ordering",
    label: "Ordering",
    description: "Message sequence preservation"
  },
  {
    name: "dataIntegrity",
    label: "Data Integrity",
    description: "Data accuracy and consistency"
  },
  {
    name: "resourceUsage",
    label: "Resource Usage",
    description: "CPU and memory consumption"
  },
  {
    name: "securityOverhead",
    label: "Security Overhead",
    description: "Encryption/authentication cost"
  }
];

const AVAILABLE_SCENARIOS = [
  {
    name: "Stable Network",
    description: "Ideal conditions with consistent connectivity",
    latency: 10,
    packetLoss: 0,
    jitter: 2,
    unstable: false
  },
  {
    name: "Unstable Network",
    description: "Poor connectivity with frequent interruptions",
    latency: 100,
    packetLoss: 5,
    jitter: 50,
    unstable: true
  },
  {
    name: "High Frequency",
    description: "High message frequency (1000+ messages/sec)",
    messageFrequency: 1000,
    duration: 10000,
    latency: 20
  },
  {
    name: "Long Duration",
    description: "Extended session with sustained load",
    duration: 60000,
    messageFrequency: 10,
    latency: 15
  },
  {
    name: "Encrypted Connection",
    description: "TLS/DTLS enabled with security overhead",
    latency: 30,
    encrypted: true,
    securityOverhead: 15
  },
  {
    name: "Concurrent Load",
    description: "Multiple simultaneous client connections",
    concurrentClients: 10,
    latency: 25,
    packetLoss: 1
  }
];

function ConfigurationPage() {
  const navigate = useNavigate();
  const { setCurrentTestRunId } = useTestRunContext();
  const [attributes, setAttributes] = useState(
    QUALITY_ATTRIBUTES.map((attr) => ({ ...attr, weight: 12.5 }))
  );
  const [selectedProtocols, setSelectedProtocols] = useState([
    "MQTT",
    "HTTP",
    "WebSocket"
  ]);
  const [selectedScenarios, setSelectedScenarios] = useState([
    AVAILABLE_SCENARIOS[0]
  ]);
  const [testName, setTestName] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // Load saved protocol config from localStorage
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState(() => {
    const stored = localStorage.getItem("mqttBrokerUrl");
    if (
      !stored ||
      stored.includes("test.mosquitto.org") ||
      stored === "mqtt://test.mosquitto.org:1883"
    ) {
      return "mqtt://broker.emqx.io:1883";
    }
    return stored;
  });
  const [httpEndpoint, setHttpEndpoint] = useState(() => {
    return localStorage.getItem("httpEndpoint") || "https://httpbin.org/post";
  });
  const [websocketUrl, setWebsocketUrl] = useState(() => {
    return (
      localStorage.getItem("websocketUrl") || "wss://echo.websocket.events"
    );
  });
  const [coapServerUrl, setCoapServerUrl] = useState(() => {
    return localStorage.getItem("coapServerUrl") || "coap://coap.me";
  });

  const handleAttributeWeightChange = (name, weight) => {
    setAttributes((attrs) =>
      attrs.map((attr) => (attr.name === name ? { ...attr, weight } : attr))
    );
  };

  const handleStartTest = () => {
    if (selectedProtocols.length === 0) {
      alert("Please select at least one protocol");
      return;
    }

    if (selectedScenarios.length === 0) {
      alert("Please select at least one scenario");
      return;
    }

    setIsRunning(true);

    // Save protocol config to localStorage
    localStorage.setItem("mqttBrokerUrl", mqttBrokerUrl);
    localStorage.setItem("httpEndpoint", httpEndpoint);
    localStorage.setItem("websocketUrl", websocketUrl);
    localStorage.setItem("coapServerUrl", coapServerUrl);

    const configuration = {
      testName: testName || `Test ${Date.now()}`,
      attributes,
      selectedProtocols,
      scenarios: selectedScenarios,
      messageSize: 1024,
      messageFrequency: 100,
      protocolConfig: {
        mqttBrokerUrl: mqttBrokerUrl.trim() || undefined,
        httpEndpoint: httpEndpoint.trim() || undefined,
        websocketUrl: websocketUrl.trim() || undefined,
        coapServerUrl: coapServerUrl.trim() || undefined
      }
    };

    startRun(configuration)
      .then((testRunId) => {
        setIsRunning(false);
        console.log("Test run started with ID:", testRunId);
        setCurrentTestRunId(testRunId);

        navigate(`/live?testRunId=${testRunId}`);

        if (window.liveProgressReloadTimer) {
          clearTimeout(window.liveProgressReloadTimer);
        }

        window.liveProgressReloadTimer = setTimeout(() => {
          console.log("Auto-reloading live progress page after 3 seconds");
          delete window.liveProgressReloadTimer;
          window.location.reload();
        }, 800);
      })
      .catch((error) => {
        setIsRunning(false);
        alert(`Error starting test: ${error.message}`);
        console.error("Error starting test:", error);
      });
  };

  return (
    <div className="configuration-page">
      <div className="container">
        <h1 className="page-title">Configure Protocol Comparison Test</h1>

        <div className="config-section">
          <label className="section-label">
            Test Name (Optional)
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Enter test name"
              className="test-name-input"
            />
          </label>
        </div>

        <div className="config-section">
          <h2 className="section-title">
            1. Select Quality Attributes & Weights
          </h2>
          <p className="section-description">
            Drag to reorder and adjust sliders to set importance weights (must
            total 100%)
          </p>
          <AttributeSelector
            attributes={attributes}
            onWeightChange={handleAttributeWeightChange}
          />
        </div>

        <div className="config-section">
          <h2 className="section-title">2. Select Protocols</h2>
          <ProtocolSelector
            selectedProtocols={selectedProtocols}
            onProtocolsChange={setSelectedProtocols}
          />
        </div>

        <div className="config-section">
          <h2 className="section-title">3. Select Test Scenarios</h2>
          <ScenarioSelector
            availableScenarios={AVAILABLE_SCENARIOS}
            selectedScenarios={selectedScenarios}
            onScenariosChange={setSelectedScenarios}
          />
        </div>

        <div className="config-section">
          <h2 className="section-title">
            4. Protocol Configuration (Optional)
          </h2>
          <p className="section-description">
            Configure protocol endpoints. Leave empty to use defaults or
            environment variables.
          </p>
          <div className="protocol-config">
            <div className="config-field">
              <label htmlFor="mqtt-broker">
                MQTT Broker URL
                <span className="field-hint">
                  (e.g., mqtt://broker.emqx.io:1883 or mqtt://broker.hivemq.com:1883)
                </span>
              </label>
              <input
                id="mqtt-broker"
                type="text"
                value={mqttBrokerUrl}
                onChange={(e) => setMqttBrokerUrl(e.target.value)}
                placeholder="mqtt://broker.emqx.io:1883"
                className="protocol-input"
              />
            </div>
            <div className="config-field">
              <label htmlFor="http-endpoint">
                HTTP Test Endpoint
                <span className="field-hint">
                  (e.g., https://httpbin.org/post or https://postman-echo.com/post)
                </span>
              </label>
              <input
                id="http-endpoint"
                type="text"
                value={httpEndpoint}
                onChange={(e) => setHttpEndpoint(e.target.value)}
                placeholder="https://httpbin.org/post"
                className="protocol-input"
              />
            </div>
            <div className="config-field">
              <label htmlFor="websocket-url">
                WebSocket Server URL
                <span className="field-hint">
                  (e.g., wss://echo.websocket.events or ws://localhost:8080)
                </span>
              </label>
              <input
                id="websocket-url"
                type="text"
                value={websocketUrl}
                onChange={(e) => setWebsocketUrl(e.target.value)}
                placeholder="wss://echo.websocket.events"
                className="protocol-input"
              />
            </div>
            <div className="config-field">
              <label htmlFor="coap-server-url">
                CoAP Server URL
                <span className="field-hint">
                  (e.g., coap://coap.me or coap://localhost:5683)
                </span>
              </label>
              <input
                id="coap-server-url"
                type="text"
                value={coapServerUrl}
                onChange={(e) => setCoapServerUrl(e.target.value)}
                placeholder="coap://coap.me"
                className="protocol-input"
              />
            </div>
            <p className="config-note">
              💡 Settings are saved automatically and will be remembered for
              future tests. You can also use environment variables:{" "}
              <code>MQTT_BROKER_URL</code>, <code>HTTP_TEST_URL</code>,
              <code>WEBSOCKET_URL</code>, and <code>COAP_SERVER_URL</code>.
            </p>
          </div>
        </div>

        <div className="config-section">
          <button
            className="start-test-btn"
            onClick={handleStartTest}
            disabled={isRunning}
          >
            {isRunning ? "Running Tests..." : "Start Benchmark Tests"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationPage;
