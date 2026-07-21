# ProtocolBench — Communication Protocol Benchmarking Tool

A web application that compares communication protocols — **MQTT, HTTP,
WebSocket and CoAP** — against the quality attributes *you* care about, under
realistic network scenarios, and produces a transparent, weighted fitness
ranking with charts and a downloadable report.

> **Modes at a glance:** runs default to a **deterministic simulation** (offline,
> reproducible, ideal for demos and CI). A **Live** mode is available to
> benchmark real endpoints. The UI and every report label which mode produced a
> result, so results are never presented as something they are not.

---

## The problem it solves

Choosing a messaging/transport protocol for an IoT or real-time system means
trading off latency, reliability, throughput, ordering, resource cost and
security overhead — and the "best" choice depends entirely on which of those
matter most for *your* workload. ProtocolBench lets you weight those attributes,
run the same scenarios across protocols, and see a defensible, explained ranking
instead of relying on folklore.

## Supported protocols & scenarios

| Protocol | Simulation | Live mode | Library |
|----------|:----------:|:---------:|---------|
| MQTT | ✅ modelled | ✅ real broker | `mqtt` |
| HTTP | ✅ modelled | ✅ real endpoint | `axios` |
| WebSocket | ✅ modelled | ✅ real echo server | `ws` |
| CoAP | ✅ modelled | ⚠️ **modelled only** | — |

**Scenarios** (network / load conditions): Stable Network, Unstable Network,
High Frequency, Long Duration, Encrypted Connection, Concurrent Load. Each
applies latency, jitter and packet-loss characteristics that shape the metrics.

**Metrics** measured/modelled per protocol: latency, jitter, reliability,
throughput, ordering, data integrity, resource usage, security overhead. Each
has a defined unit and "direction" (higher- or lower-is-better) centralised in
`imports/shared/metrics.js`.

## How the benchmarking works

1. You configure a test: name it, weight the quality attributes (must total
   100 %), pick protocols and scenarios, and choose Simulation or Live mode.
2. The server creates a run and executes every `protocol × scenario`
   combination, streaming progress and an execution log over Server-Sent Events.
3. Each combination yields a metrics object.
   - **Simulation:** `imports/test-engine/simulation.js` produces
     physically-plausible values from per-protocol baselines modulated by the
     scenario's network conditions, seeded so the same configuration always
     yields the same result.
   - **Live:** the protocol testers exchange real messages with the configured
     endpoints and measure the outcome.
4. Results are scored, ranked and visualised.

### How attribute weights drive the ranking

Scoring lives in one place (`computeFitnessScores` in
`imports/shared/metrics.js`) and is shared by the server and the client so the
two can never disagree:

1. Average each protocol's metrics across the scenarios it ran.
2. Normalise every metric to a **0–100 scale across the protocols being
   compared**, inverting lower-is-better metrics (latency, jitter, resource
   usage, security overhead) so "higher normalised = better" everywhere.
3. Multiply each normalised value by the weight you assigned that attribute and
   take the weighted average → the **fitness score out of 100**.
4. Protocols that produced no usable data are **excluded** from normalisation
   and ranking, so a failed protocol (all-zero metrics) can never masquerade as
   the fastest/winner.

The Results page explains this inline and highlights the winner's strongest
attributes.

## Architecture

```
Browser (client-rendered SPA)                Next.js server
┌───────────────────────────┐               ┌────────────────────────────┐
│ React + react-router-dom  │  fetch / SSE  │ pages/api/tests/*           │
│ pages: Configuration,     │ ────────────► │  startRun · stream ·        │
│ Live Progress, Results,   │ ◄──────────── │  results · logs · history   │
│ History                   │   JSON/events │                             │
│ Chart.js visualisations   │               │ lib/server/runService.js    │
└───────────────────────────┘               │  → test-engine (sim/live)   │
                                             │  → mongo.js (Mongo OR local │
                                             │    JSON fallback)           │
                                             └────────────────────────────┘
shared, framework-agnostic logic: imports/shared/{metrics,validation,report}.js
```

- **Rendering:** a catch-all page (`pages/[[...slug]].jsx`) mounts a
  client-only React app; routing is handled by `react-router-dom`.
- **Live updates:** `pages/api/tests/stream.js` pushes run/result/log events via
  SSE; the client also polls as a safety net.
- **Persistence:** `lib/server/mongo.js` uses MongoDB when `MONGO_URL` is set,
  otherwise an in-memory store backed by a local JSON file
  (`.local-data/`) — so the app runs with **zero external dependencies**.
- **Shared core:** metric metadata, validation and report generation are pure
  ES modules imported by client, server and tests alike.

## Tech stack

- **Framework:** Next.js 16 (Pages Router), React 18
- **Routing (client):** react-router-dom 6
- **Charts:** Chart.js 4 + react-chartjs-2
- **Protocol libraries (live mode):** `mqtt`, `axios`, `ws`
- **Persistence:** MongoDB (optional) or a local JSON fallback
- **Testing:** Vitest (unit + integration), Playwright (E2E)

## Local setup

Requires Node 18+ (developed on Node 24).

```bash
npm install
npm run dev          # http://localhost:3000
```

No database or broker is required — the default Simulation mode is fully
offline. Optionally copy `.env.example` to `.env.local` to point at a real
MongoDB or (for Live mode) real endpoints.

## Environment variables

All optional — see `.env.example`. Nothing is required to run the app.

| Variable | Purpose | Default |
|----------|---------|---------|
| `MONGO_URL` | Use MongoDB instead of the local JSON store | local JSON file |
| `MONGO_DB_NAME` | Database name | inferred from `MONGO_URL` |
| `SIM_STEP_MS` | Delay between simulated steps (0 = instant) | `220` |
| `MQTT_BROKER_URL` | Default MQTT endpoint (Live mode) | UI value / `mqtt://broker.emqx.io:1883` |
| `HTTP_TEST_URL` | Default HTTP endpoint (Live mode) | UI value / `https://httpbin.org/post` |
| `WEBSOCKET_URL` | Default WebSocket endpoint (Live mode) | UI value / public echo servers |
| `COAP_SERVER_URL` | CoAP endpoint (currently informational) | UI value / `coap://coap.me` |

## Testing

```bash
npm test                 # unit + integration (Vitest)
npm run test:unit        # scoring, normalisation, validation, simulation
npm run test:integration # run lifecycle + API boundary (simulation mode)
npm run test:e2e         # Playwright end-to-end flows (starts a dev server)
```

- **Unit** tests cover the scoring formula (higher/lower-is-better, missing
  metrics, failed-protocol exclusion, ranking determinism), validation rules,
  formatting and the simulation model.
- **Integration** tests drive the real run service and the `startRun` API in
  simulation mode — success, partial failure, total failure, results/history
  retrieval, and "never stuck in running".
- **E2E** tests cover: successful benchmark, validation blocking, failure
  handling (Live mode against a refused port — real and fast), history, and
  theme/responsive behaviour.

## Build & deploy

```bash
npm run build            # next build (webpack)
npm start                # serve the production build
```

Deploys to any Node host or Next.js-compatible platform (e.g. Vercel). Set
`MONGO_URL` in the host's environment for durable, multi-instance persistence
(the local JSON fallback is per-instance and intended for development/demo).

## Known limitations

- **CoAP is always modelled**, even in Live mode — the `coap` library is not
  wired to a real server. This is labelled in the UI and report.
- **Live mode depends on third-party endpoints** (public brokers/echo servers)
  and is therefore non-deterministic and subject to their availability and rate
  limits. Simulation mode is the reliable, reproducible path.
- The **local JSON store is single-instance**; use MongoDB for production.
- Resource-usage and security-overhead figures are **relative indices**, not
  absolute measurements.

> **Security note:** an earlier commit contained a real MongoDB connection
> string in `private/settings.json`. It has been replaced with a placeholder and
> the file is now git-ignored, **but that credential is in git history and
> should be rotated.**

## Engineering decisions

- **One source of truth for metrics & scoring.** Units, directions, formatting,
  normalisation and ranking live in `imports/shared/` and are used by the UI,
  the server and the tests — eliminating the duplicated/divergent scoring the
  original had.
- **Simulation-first for honesty *and* reliability.** Real public endpoints are
  flaky; a deterministic, clearly-labelled model makes the tool demo-able and
  testable without pretending modelled numbers are measurements.
- **Failed protocols are first-class.** They're detected, surfaced, and excluded
  from ranking so the headline result is always trustworthy.
- **Concurrency-safe logging.** Per-run log routing replaced a global handler
  that overlapping runs could clobber.
- **Honest visualisation.** Metrics with incompatible units are compared on a
  normalised 0–100 axis (never one raw shared axis); latency is shown per
  scenario as bars rather than a fabricated single-point "trend" line; every
  chart has an accessible table/textual counterpart.

## Demo walkthrough (≈2 minutes)

1. **Configure** — open the app. Give the test a name, leave the default even
   weights (or drag priorities / adjust sliders and hit *Normalise to 100 %*).
   Keep MQTT + HTTP + WebSocket and the *Stable Network* scenario. Leave mode on
   *Simulation*.
2. **Run** — click **Start benchmark**. Watch the Live Progress page: per-protocol
   status, an animated overall bar, and a filterable execution log.
3. **Read the result** — on Results, note the **winner card** (why it won +
   strongest attributes), the full ranking with score bars, the raw-metrics
   table, and the normalised / radar / latency charts.
4. **Change priorities** — run again weighting *Latency* heavily, then again
   weighting *Reliability*: the winner changes, demonstrating the weighting.
5. **Toggle theme** and shrink the window to show dark mode and the responsive
   mobile layout. Open **History** to revisit any run, and **Download report**
   for the JSON export.

---

*Originally built for FIT2107 (Software Quality and Testing) and since evolved
from a Meteor prototype into a Next.js application.*
