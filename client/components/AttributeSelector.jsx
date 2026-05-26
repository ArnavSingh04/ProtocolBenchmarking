// Chatgpt by openAI was used to assist in the writing the code for the following file
import React, { useState, useEffect } from "react";

function AttributeSelector({ attributes, onWeightChange }) {
  const [orderedAttributes, setOrderedAttributes] = useState(attributes);

  // Sync with parent when attributes change
  useEffect(() => {
    setOrderedAttributes(attributes);
  }, [attributes]);

  const totalWeight = orderedAttributes.reduce(
    (sum, attr) => sum + attr.weight,
    0
  );
  const isTotalValid = Math.abs(totalWeight - 100) < 0.1;

  const moveAttribute = (fromIndex, toIndex) => {
    const newOrder = [...orderedAttributes];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setOrderedAttributes(newOrder);
    // Notify parent about new order (optional - could be used to save order preference)
  };

  return (
    <div className="attribute-selector">
      {orderedAttributes.map((attribute, index) => (
        <div key={attribute.name} className="attribute-item">
          <div className="reorder-buttons">
            {index > 0 && (
              <button
                className="move-btn move-up"
                onClick={() => moveAttribute(index, index - 1)}
                title="Move up"
              >
                ↑
              </button>
            )}
            {index < orderedAttributes.length - 1 && (
              <button
                className="move-btn move-down"
                onClick={() => moveAttribute(index, index + 1)}
                title="Move down"
              >
                ↓
              </button>
            )}
          </div>
          <div className="attribute-info">
            <div className="attribute-header">
              <span className="attribute-name">{attribute.label}</span>
              <span className="attribute-weight">
                {attribute.weight.toFixed(1)}%
              </span>
            </div>
            <p className="attribute-description">{attribute.description}</p>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={attribute.weight}
                onChange={(e) =>
                  onWeightChange(attribute.name, parseFloat(e.target.value))
                }
                className="weight-slider"
                step="0.1"
              />
              <div className="slider-value-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={attribute.weight.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onWeightChange(
                      attribute.name,
                      Math.max(0, Math.min(100, val))
                    );
                  }}
                  step="0.1"
                  className="number-input"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="weight-summary">
        <span className={`total-weight ${isTotalValid ? "valid" : "invalid"}`}>
          Total: {totalWeight.toFixed(1)}%
        </span>
        {!isTotalValid && (
          <span className="weight-warning">Weights should total 100%</span>
        )}
      </div>
    </div>
  );
}

export default AttributeSelector;
