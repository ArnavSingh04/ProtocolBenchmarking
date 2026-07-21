import React from "react";

function ScenarioSelector({
  availableScenarios,
  selectedScenarios,
  onScenariosChange,
  error
}) {
  const toggleScenario = (scenario) => {
    const isSelected = selectedScenarios.some((s) => s.name === scenario.name);
    if (isSelected) {
      onScenariosChange(
        selectedScenarios.filter((s) => s.name !== scenario.name)
      );
    } else {
      onScenariosChange([...selectedScenarios, scenario]);
    }
  };

  return (
    <div className="scenario-selector">
      <div className="scenario-grid" role="group" aria-label="Test scenarios">
        {availableScenarios.map((scenario) => {
          const checked = selectedScenarios.some(
            (s) => s.name === scenario.name
          );
          return (
            <label
              key={scenario.name}
              className={`select-card scenario-card ${checked ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                className="visually-hidden"
                checked={checked}
                onChange={() => toggleScenario(scenario)}
              />
              <span className="select-check" aria-hidden="true">
                {checked && "✓"}
              </span>
              <span className="select-card-title">{scenario.name}</span>
              <span className="select-card-desc">{scenario.description}</span>
              <span className="scenario-params">
                {typeof scenario.latency === "number" && (
                  <span className="tag">Latency {scenario.latency}ms</span>
                )}
                {typeof scenario.packetLoss === "number" && (
                  <span className="tag">Loss {scenario.packetLoss}%</span>
                )}
                {typeof scenario.jitter === "number" && (
                  <span className="tag">Jitter {scenario.jitter}ms</span>
                )}
                {scenario.encrypted && <span className="tag">Encrypted</span>}
                {scenario.unstable && <span className="tag">Unstable</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default ScenarioSelector;
