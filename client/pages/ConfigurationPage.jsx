import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import AttributeSelector from "../components/AttributeSelector";
import ProtocolSelector from "../components/ProtocolSelector";
import ScenarioSelector from "../components/ScenarioSelector";
import { startRun } from "../lib/api";
import { QUALITY_ATTRIBUTES, SCENARIOS } from "../../imports/shared/metrics";
import { validateConfiguration } from "../../imports/shared/validation";

const ENDPOINT_FIELDS = [
  {
    key: "mqttBrokerUrl",
    protocol: "MQTT",
    label: "MQTT Broker URL",
    placeholder: "mqtt://broker.emqx.io:1883",
    hint: "Public brokers: broker.emqx.io, broker.hivemq.com"
  },
  {
    key: "httpEndpoint",
    protocol: "HTTP",
    label: "HTTP Endpoint",
    placeholder: "https://httpbin.org/post",
    hint: "Any endpoint that accepts a POST body"
  },
  {
    key: "websocketUrl",
    protocol: "WebSocket",
    label: "WebSocket URL",
    placeholder: "wss://echo.websocket.org",
    hint: "An echo server works well for benchmarking"
  },
  {
    key: "coapServerUrl",
    protocol: "CoAP",
    label: "CoAP Server URL",
    placeholder: "coap://coap.me",
    hint: "CoAP is always modelled (see limitations)"
  }
];

function loadStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function ConfigurationPage() {
  const navigate = useNavigate();
  const { setActiveTestRunId, refreshSession } = useTestRunContext();
  const startingRef = useRef(false);

  const [attributes, setAttributes] = useState(() =>
    QUALITY_ATTRIBUTES.map((attr) => ({ ...attr, weight: 12.5 }))
  );
  const [selectedProtocols, setSelectedProtocols] = useState([
    "MQTT",
    "HTTP",
    "WebSocket"
  ]);
  const [selectedScenarios, setSelectedScenarios] = useState([SCENARIOS[0]]);
  const [testName, setTestName] = useState("");
  const [mode, setMode] = useState(() =>
    loadStored("benchmarkMode", "simulation") === "live" ? "live" : "simulation"
  );
  const [endpoints, setEndpoints] = useState(() => ({
    mqttBrokerUrl: loadStored("mqttBrokerUrl", "mqtt://broker.emqx.io:1883"),
    httpEndpoint: loadStored("httpEndpoint", "https://httpbin.org/post"),
    websocketUrl: loadStored("websocketUrl", "wss://echo.websocket.org"),
    coapServerUrl: loadStored("coapServerUrl", "coap://coap.me")
  }));

  const [isRunning, setIsRunning] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const configuration = useMemo(
    () => ({
      testName,
      attributes,
      selectedProtocols,
      scenarios: selectedScenarios,
      mode,
      messageSize: 1024,
      messageFrequency: 100,
      protocolConfig: mode === "live" ? endpoints : {}
    }),
    [testName, attributes, selectedProtocols, selectedScenarios, mode, endpoints]
  );

  const { valid, errors } = useMemo(
    () => validateConfiguration(configuration),
    [configuration]
  );

  const totalTests = selectedProtocols.length * selectedScenarios.length;

  const setEndpoint = (key, value) =>
    setEndpoints((prev) => ({ ...prev, [key]: value }));

  const handleStartTest = () => {
    if (!valid || startingRef.current) return;
    startingRef.current = true;
    setIsRunning(true);
    setSubmitError(null);

    try {
      localStorage.setItem("benchmarkMode", mode);
      Object.entries(endpoints).forEach(([k, v]) => localStorage.setItem(k, v));
    } catch {
      /* ignore storage errors */
    }

    startRun(configuration)
      .then((testRunId) => {
        setActiveTestRunId(testRunId);
        refreshSession();
        navigate(`/live?testRunId=${testRunId}`);
      })
      .catch((error) => {
        setIsRunning(false);
        startingRef.current = false;
        setSubmitError(error.message || "Could not start the benchmark.");
      });
  };

  const blockingReasons = [
    errors.protocols,
    errors.scenarios,
    errors.weights,
    errors.attributes,
    errors.testName,
    errors.mqttBrokerUrl,
    errors.httpEndpoint,
    errors.websocketUrl,
    errors.coapServerUrl
  ].filter(Boolean);

  return (
    <div className="configuration-page">
      <div className="container config-layout">
        <div className="config-main">
          <header className="page-head">
            <h1 className="page-title">Configure a benchmark</h1>
            <p className="section-description">
              Weight the quality attributes that matter to you, pick the
              protocols and network scenarios, then run the comparison.
            </p>
          </header>

          {/* Mode */}
          <section className="config-section">
            <div className="section-head">
              <h2 className="section-title">Run mode</h2>
            </div>
            <div className="mode-row">
              <div
                className="segmented"
                role="group"
                aria-label="Benchmark run mode"
              >
                <button
                  type="button"
                  aria-pressed={mode === "simulation"}
                  onClick={() => setMode("simulation")}
                >
                  Simulation
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "live"}
                  onClick={() => setMode("live")}
                >
                  Live
                </button>
              </div>
              <p className="section-description mode-note">
                {mode === "simulation"
                  ? "Deterministic model — no network calls. Reproducible and ideal for demos."
                  : "Contacts the endpoints below. Results depend on network conditions and endpoint availability."}
              </p>
            </div>
          </section>

          {/* Test name */}
          <section className="config-section">
            <div className="field">
              <label className="field-label" htmlFor="test-name">
                Test name <span className="muted">(optional)</span>
              </label>
              <input
                id="test-name"
                type="text"
                className={`input ${errors.testName ? "input-error" : ""}`}
                value={testName}
                maxLength={140}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. IoT telemetry — low latency priority"
              />
              {errors.testName ? (
                <span className="field-error">{errors.testName}</span>
              ) : (
                <span className="field-hint">
                  Leave blank to auto-name with a timestamp.
                </span>
              )}
            </div>
          </section>

          {/* Attributes */}
          <section className="config-section">
            <div className="section-head">
              <h2 className="section-title">1. Quality attributes &amp; weights</h2>
            </div>
            <div className="alert alert-info section-explainer">
              <span className="alert-icon" aria-hidden="true">
                ⓘ
              </span>
              <span>
                Each protocol's measured metrics are normalised across the
                comparison, then multiplied by these weights to produce a fitness
                score out of 100. Heavier weights make an attribute matter more.
                Order sets priority for readability; weights drive the score.
              </span>
            </div>
            <AttributeSelector attributes={attributes} onChange={setAttributes} />
          </section>

          {/* Protocols */}
          <section className="config-section">
            <div className="section-head">
              <h2 className="section-title">2. Protocols</h2>
              <span className="muted">{selectedProtocols.length} selected</span>
            </div>
            <ProtocolSelector
              selectedProtocols={selectedProtocols}
              onProtocolsChange={setSelectedProtocols}
              error={errors.protocols}
            />
          </section>

          {/* Scenarios */}
          <section className="config-section">
            <div className="section-head">
              <h2 className="section-title">3. Test scenarios</h2>
              <span className="muted">{selectedScenarios.length} selected</span>
            </div>
            <ScenarioSelector
              availableScenarios={SCENARIOS}
              selectedScenarios={selectedScenarios}
              onScenariosChange={setSelectedScenarios}
              error={errors.scenarios}
            />
          </section>

          {/* Endpoints */}
          <section className="config-section">
            <div className="section-head">
              <h2 className="section-title">4. Protocol endpoints</h2>
              <span className="muted">
                {mode === "live" ? "used in live mode" : "ignored in simulation"}
              </span>
            </div>
            {mode === "simulation" && (
              <div className="alert alert-info section-explainer">
                <span className="alert-icon" aria-hidden="true">
                  ⓘ
                </span>
                <span>
                  Simulation mode does not contact these endpoints. Switch to
                  Live mode to benchmark real servers.
                </span>
              </div>
            )}
            <div className="endpoint-grid">
              {ENDPOINT_FIELDS.map((f) => (
                <div className="field" key={f.key}>
                  <label className="field-label" htmlFor={f.key}>
                    {f.label}
                  </label>
                  <input
                    id={f.key}
                    type="text"
                    className={`input ${errors[f.key] ? "input-error" : ""}`}
                    value={endpoints[f.key]}
                    onChange={(e) => setEndpoint(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    disabled={mode !== "live"}
                    aria-describedby={`${f.key}-hint`}
                  />
                  {errors[f.key] ? (
                    <span className="field-error">{errors[f.key]}</span>
                  ) : (
                    <span className="field-hint" id={`${f.key}-hint`}>
                      {f.hint}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky summary / action */}
        <aside className="config-summary" aria-label="Run summary">
          <div className="card card-pad summary-card">
            <h2 className="summary-title">Run summary</h2>
            <dl className="summary-list">
              <div className="summary-row">
                <dt>Mode</dt>
                <dd>
                  <span className={`badge ${mode === "live" ? "badge-warning" : "badge-primary"}`}>
                    {mode === "live" ? "Live" : "Simulated"}
                  </span>
                </dd>
              </div>
              <div className="summary-row">
                <dt>Protocols</dt>
                <dd>{selectedProtocols.join(", ") || "—"}</dd>
              </div>
              <div className="summary-row">
                <dt>Scenarios</dt>
                <dd>{selectedScenarios.length || "—"}</dd>
              </div>
              <div className="summary-row">
                <dt>Benchmarks</dt>
                <dd>{totalTests}</dd>
              </div>
            </dl>

            {submitError && (
              <div className="alert alert-danger" role="alert">
                <span className="alert-icon" aria-hidden="true">
                  ⚠
                </span>
                <span>{submitError}</span>
              </div>
            )}

            {!valid && blockingReasons.length > 0 && (
              <div className="summary-blockers" role="status">
                <p className="summary-blockers-title">Before you can start:</p>
                <ul>
                  {blockingReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={handleStartTest}
              disabled={!valid || isRunning}
            >
              {isRunning ? "Starting…" : "Start benchmark"}
            </button>
            <p className="summary-foot section-description">
              {totalTests > 0
                ? `Runs ${totalTests} benchmark${totalTests > 1 ? "s" : ""} (${
                    selectedProtocols.length
                  } × ${selectedScenarios.length}).`
                : "Select at least one protocol and scenario."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ConfigurationPage;
