// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";

const AVAILABLE_PROTOCOLS = [
  {
    id: "MQTT",
    name: "MQTT",
    description: "Message Queuing Telemetry Transport - Ideal for IoT"
  },
  {
    id: "HTTP",
    name: "HTTP",
    description: "Hypertext Transfer Protocol - Standard web protocol"
  },
  {
    id: "WebSocket",
    name: "WebSocket",
    description: "Full-duplex communication - Real-time web apps"
  },
  {
    id: "CoAP",
    name: "CoAP",
    description:
      "Constrained Application Protocol - Resource-constrained devices"
  }
];

function ProtocolSelector({ selectedProtocols, onProtocolsChange }) {
  const toggleProtocol = (protocolId) => {
    if (selectedProtocols.includes(protocolId)) {
      onProtocolsChange(selectedProtocols.filter((p) => p !== protocolId));
    } else {
      onProtocolsChange([...selectedProtocols, protocolId]);
    }
  };

  return (
    <div className="protocol-selector">
      <div className="protocol-grid">
        {AVAILABLE_PROTOCOLS.map((protocol) => (
          <div
            key={protocol.id}
            className={`protocol-card ${
              selectedProtocols.includes(protocol.id) ? "selected" : ""
            }`}
            onClick={() => toggleProtocol(protocol.id)}
          >
            <div className="protocol-checkbox">
              {selectedProtocols.includes(protocol.id) && "✓"}
            </div>
            <h3 className="protocol-name">{protocol.name}</h3>
            <p className="protocol-description">{protocol.description}</p>
          </div>
        ))}
      </div>
      {selectedProtocols.length === 0 && (
        <p className="selection-hint">
          Select at least one protocol to compare
        </p>
      )}
    </div>
  );
}

export default ProtocolSelector;
