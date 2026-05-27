# Configuration Guide

## Quick Start - UI Configuration (Recommended)

The easiest way to configure all protocol endpoints is through the UI:

1. Go to the Configuration page
2. Scroll to "4. Protocol Configuration (Optional)"
3. Configure endpoints for the protocols you're testing:
   - **MQTT Broker URL** (e.g., `mqtt://192.168.0.17:1883`)
   - **HTTP Endpoint** (e.g., `https://webhook.site/your-id`)
   - **WebSocket URL** (e.g., `wss://websocket-echo.com/` or `wss://echo.websocket.org`)
   - **CoAP Server URL** (e.g., `coap://localhost:5683`)
4. Settings are automatically saved to localStorage and will be remembered for future tests

**No hardcoded IPs needed!** You can change any endpoint anytime from the UI.

## MQTT Broker Configuration

The MQTT tester can use a custom broker URL. You can configure it in three ways (priority order):

### Option 1: UI Configuration (Easiest) ⭐
Configure directly in the Configuration page before starting a test. Settings are saved to localStorage and persist across sessions.

### Option 2: Environment Variable
Set the environment variable before starting Meteor:
```bash
export MQTT_BROKER_URL="mqtt://your-broker-ip:1883"
meteor run
```

### Option 3: Default
If not configured, it will use `mqtt://localhost:1883`

## HTTP Endpoint Configuration

Similarly, you can configure a custom HTTP endpoint:

```bash
export HTTP_TEST_URL="http://localhost:8080/echo"
meteor run
```

Or in configuration:
```javascript
protocolConfig: {
  httpEndpoint: "http://your-server/endpoint"
}
```

## WebSocket Server Configuration

Configure a custom WebSocket server URL:

**Via UI (Recommended):** Enter the WebSocket URL in the Configuration page (e.g., `ws://localhost:8080` or `wss://your-server.com`)

**Via Environment Variable:**
```bash
export WEBSOCKET_URL="ws://localhost:8080"
meteor run
```

**Via Configuration:**
```javascript
protocolConfig: {
  websocketUrl: "ws://your-websocket-server:8080"
}
```

Default: `wss://websocket-echo.com/` (with fallbacks to `wss://echo.websocket.org` and `wss://ws.ifelse.io`)

## CoAP Server Configuration

Configure a custom CoAP server URL:

**Via UI (Recommended):** Enter the CoAP server URL in the Configuration page (e.g., `coap://localhost:5683`)

**Via Environment Variable:**
```bash
export COAP_SERVER_URL="coap://localhost:5683"
meteor run
```

**Via Configuration:**
```javascript
protocolConfig: {
  coapServerUrl: "coap://your-coap-server:5683"
}
```

Default: `coap://localhost:5683`

**Note:** The current CoAP implementation uses simulation. For real CoAP server testing, you'll need a CoAP server running and may need to adjust the implementation.

## Testing Your Broker

To test if your MQTT broker is working, you can use the default Mosquitto test broker first, then switch to your own.

For a quick test MQTT broker, you can run:
```bash
docker run -it -p 1883:1883 eclipse-mosquitto
```

Then use: `mqtt://localhost:1883`

## Troubleshooting

Check the detailed execution log in the Live Progress page to see:
- Connection errors
- Message send/receive counts
- Any network or authentication issues

If metrics are still zero, check:
1. Network connectivity to broker/endpoint
2. Firewall rules
3. Broker authentication requirements
4. Port accessibility (1883 for MQTT, 443/80 for HTTP)

