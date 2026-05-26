// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";

function ScenarioSelector({
  availableScenarios,
  selectedScenarios,
  onScenariosChange
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
      <div className="scenario-list">
        {availableScenarios.map((scenario) => {
          const isSelected = selectedScenarios.some(
            (s) => s.name === scenario.name
          );
          return (
            <div
              key={scenario.name}
              className={`scenario-card ${isSelected ? "selected" : ""}`}
              onClick={() => toggleScenario(scenario)}
            >
              <div className="scenario-checkbox">{isSelected && "✓"}</div>
              <div className="scenario-content">
                <h3 className="scenario-name">{scenario.name}</h3>
                <p className="scenario-description">{scenario.description}</p>
                <div className="scenario-params">
                  {scenario.latency && (
                    <span>Latency: {scenario.latency}ms</span>
                  )}
                  {scenario.packetLoss !== undefined && (
                    <span>Loss: {scenario.packetLoss}%</span>
                  )}
                  {scenario.jitter && <span>Jitter: {scenario.jitter}ms</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedScenarios.length === 0 && (
        <p className="selection-hint">Select at least one scenario to test</p>
      )}
    </div>
  );
}

export default ScenarioSelector;
