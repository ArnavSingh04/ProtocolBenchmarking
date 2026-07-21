import React from "react";
import { isWeightTotalValid, sumWeights } from "../../imports/shared/validation";

/**
 * Controlled weight/priority editor. The parent owns the full attribute array
 * (order + weights) so reordering is never lost when a weight changes.
 */
function AttributeSelector({ attributes, onChange }) {
  const total = sumWeights(attributes);
  const valid = isWeightTotalValid(total);

  const setWeight = (name, rawWeight) => {
    const weight = Math.max(0, Math.min(100, Number(rawWeight) || 0));
    onChange(
      attributes.map((attr) =>
        attr.name === name ? { ...attr, weight } : attr
      )
    );
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= attributes.length) return;
    const next = [...attributes];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const distributeEvenly = () => {
    const even = Math.round((100 / attributes.length) * 10) / 10;
    const next = attributes.map((attr) => ({ ...attr, weight: even }));
    // Correct rounding drift on the first item.
    const drift = 100 - sumWeights(next);
    if (next.length) {
      next[0] = {
        ...next[0],
        weight: Math.round((next[0].weight + drift) * 10) / 10
      };
    }
    onChange(next);
  };

  const normalizeTo100 = () => {
    const current = sumWeights(attributes);
    if (current <= 0) {
      distributeEvenly();
      return;
    }
    const scaled = attributes.map((attr) => ({
      ...attr,
      weight: Math.round((attr.weight / current) * 1000) / 10
    }));
    const drift = 100 - sumWeights(scaled);
    // Push the rounding remainder onto the heaviest attribute.
    let heaviestIdx = 0;
    scaled.forEach((a, i) => {
      if (a.weight > scaled[heaviestIdx].weight) heaviestIdx = i;
    });
    scaled[heaviestIdx] = {
      ...scaled[heaviestIdx],
      weight: Math.round((scaled[heaviestIdx].weight + drift) * 10) / 10
    };
    onChange(scaled);
  };

  return (
    <div className="attribute-selector">
      <ul className="attribute-list">
        {attributes.map((attribute, index) => (
          <li key={attribute.name} className="attribute-item">
            <div className="reorder-buttons">
              <button
                type="button"
                className="move-btn"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${attribute.label} up`}
              >
                ↑
              </button>
              <span className="attribute-rank" aria-hidden="true">
                {index + 1}
              </span>
              <button
                type="button"
                className="move-btn"
                onClick={() => move(index, 1)}
                disabled={index === attributes.length - 1}
                aria-label={`Move ${attribute.label} down`}
              >
                ↓
              </button>
            </div>

            <div className="attribute-body">
              <div className="attribute-header">
                <label
                  className="attribute-name"
                  htmlFor={`weight-${attribute.name}`}
                >
                  {attribute.label}
                </label>
                <span className="attribute-weight">
                  {attribute.weight.toFixed(1)}%
                </span>
              </div>
              <p className="attribute-description">{attribute.description}</p>
              <div className="slider-container">
                <input
                  id={`weight-${attribute.name}`}
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={attribute.weight}
                  onChange={(e) => setWeight(attribute.name, e.target.value)}
                  className="weight-slider"
                  aria-valuetext={`${attribute.weight.toFixed(1)} percent`}
                />
                <div className="number-wrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={Number(attribute.weight.toFixed(1))}
                    onChange={(e) => setWeight(attribute.name, e.target.value)}
                    className="number-input"
                    aria-label={`${attribute.label} weight percent`}
                  />
                  <span className="number-suffix">%</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="weight-summary">
        <div className="weight-total" aria-live="polite">
          <span
            className={`total-pill ${valid ? "valid" : "invalid"}`}
          >
            {valid ? "✓" : "!"} Total: {total.toFixed(1)}%
          </span>
          {!valid && (
            <span className="weight-warning">
              Weights must total 100% before you can start.
            </span>
          )}
        </div>
        <div className="weight-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={distributeEvenly}>
            Distribute evenly
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={normalizeTo100}
            disabled={valid}
          >
            Normalise to 100%
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttributeSelector;
