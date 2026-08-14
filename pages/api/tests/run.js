import { runBenchmark } from "../../../lib/server/benchmarkRunner";
import {
  validateConfiguration,
  isValidRunId
} from "../../../imports/shared/validation";

// Allow up to 5 minutes for a full run to stream (Vercel Pro ceiling). The
// whole benchmark executes inside this one request — there is no background
// work to survive after the response, which is what serverless requires.
export const config = {
  maxDuration: 300
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { configuration, testRunId } = req.body || {};

  if (testRunId != null && !isValidRunId(testRunId)) {
    return res.status(400).json({ error: "Invalid testRunId format." });
  }

  const { valid, errors, normalized } = validateConfiguration(configuration);
  if (!valid) {
    return res.status(400).json({
      error: "Invalid configuration.",
      fieldErrors: errors
    });
  }

  // Stream newline-delimited JSON (NDJSON) events as the benchmark runs.
  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    // Defeat proxy buffering so events arrive live rather than all at once.
    "X-Accel-Buffering": "no",
    Connection: "keep-alive"
  });

  let clientGone = false;
  req.on("close", () => {
    clientGone = true;
  });

  const write = (event) => {
    if (clientGone) return;
    res.write(`${JSON.stringify(event)}\n`);
    if (typeof res.flush === "function") res.flush();
  };

  try {
    await runBenchmark(normalized, write, { testRunId: testRunId || null });
  } catch (error) {
    // runBenchmark already emits a terminal `done` on failure; this is a
    // last-resort guard against an unexpected throw.
    console.error("[run] Unexpected benchmark error:", error);
    write({
      type: "done",
      payload: {
        status: "failed",
        error: "The benchmark failed to complete.",
        results: {},
        endTime: new Date().toISOString()
      }
    });
  } finally {
    if (!clientGone) res.end();
  }
}
