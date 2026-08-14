# Configuration Guide

## Run modes

ProtocolBench has two run modes, chosen on the Configuration page:

- **Simulation (default):** a deterministic, offline model. No network calls are
  made and endpoint settings are ignored. Reproducible — the same configuration
  always yields the same result. Best for demos, comparisons and CI.
- **Live:** the app connects to the endpoints below and exchanges real messages.
  Results depend on network conditions and endpoint availability.

Only switch to Live mode when you want to benchmark real servers.

## Endpoints (Live mode only)

Configure these on the Configuration page (saved to `localStorage`) or via
environment variables. Priority: **UI value → environment variable → default**.

| Protocol | UI field | Env var | Default |
|----------|----------|---------|---------|
| MQTT | MQTT Broker URL | `MQTT_BROKER_URL` | `mqtt://broker.emqx.io:1883` |
| HTTP | HTTP Endpoint | `HTTP_TEST_URL` | `https://httpbin.org/post` |
| WebSocket | WebSocket URL | `WEBSOCKET_URL` | public echo servers |
| CoAP | CoAP Server URL | `COAP_SERVER_URL` | `coap://coap.me` |

> **CoAP is always modelled**, even in Live mode — the `coap` library is not
> wired to a live server in this build. The other three protocols perform real
> network I/O in Live mode.

## Persistence

Runs are stored **per-browser** in `localStorage` — there is no server database.
The benchmark executes inside a single streaming API request (`/api/tests/run`)
and the browser accumulates the streamed results, so the app is fully stateless
server-side and runs on serverless hosts (e.g. Vercel) with zero setup.

Implications:

- History is local to each browser and not shared across devices or users.
- Clearing site data / `localStorage` clears run history.
- A benchmark must finish within one request (the route allows up to 5 min).

See `.env.example` for all variables. Never commit real credentials.

## Trying a local MQTT broker (Live mode)

```bash
docker run -it -p 1883:1883 eclipse-mosquitto
# then set the MQTT Broker URL to mqtt://localhost:1883
```

## Troubleshooting Live mode

Open the Live Progress page and filter the execution log to **Errors** to see
connection failures. Common causes when metrics come back as a failure:

1. Endpoint unreachable / wrong URL scheme (mqtt://, ws(s)://, http(s)://)
2. Firewall or port blocking (1883 for MQTT, 443/80 for HTTP)
3. Broker authentication requirements
4. Public endpoint rate limits or downtime — prefer Simulation mode for
   reliable, repeatable results.
