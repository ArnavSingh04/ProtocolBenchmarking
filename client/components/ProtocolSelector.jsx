import React from "react";
import { PROTOCOLS, PROTOCOL_IDS } from "../../imports/shared/metrics";

function ProtocolSelector({ selectedProtocols, onProtocolsChange, error }) {
  const toggleProtocol = (protocolId) => {
    if (selectedProtocols.includes(protocolId)) {
      onProtocolsChange(selectedProtocols.filter((p) => p !== protocolId));
    } else {
      onProtocolsChange([...selectedProtocols, protocolId]);
    }
  };

  return (
    <div className="protocol-selector">
      <div className="protocol-grid" role="group" aria-label="Protocols to compare">
        {PROTOCOL_IDS.map((id) => {
          const protocol = PROTOCOLS[id];
          const checked = selectedProtocols.includes(id);
          return (
            <label
              key={id}
              className={`select-card protocol-card ${checked ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                className="visually-hidden"
                checked={checked}
                onChange={() => toggleProtocol(id)}
              />
              <span className="select-check" aria-hidden="true">
                {checked && "✓"}
              </span>
              <span className="protocol-card-head">
                <span
                  className="protocol-dot"
                  style={{ background: protocol.color }}
                  aria-hidden="true"
                />
                <span className="select-card-title">{protocol.name}</span>
              </span>
              <span className="select-card-desc">{protocol.tagline}</span>
              <span className="protocol-features">
                {protocol.features.map((f) => (
                  <span key={f} className="tag">
                    {f}
                  </span>
                ))}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default ProtocolSelector;
