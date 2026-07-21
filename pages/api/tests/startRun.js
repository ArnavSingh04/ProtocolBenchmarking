import { startRun } from "../../../lib/server/runService";
import { validateConfiguration } from "../../../imports/shared/validation";

export const config = {
  maxDuration: 300
};

const UUID_RE = /^[a-zA-Z0-9-]{8,64}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { configuration, testRunId } = req.body || {};

    if (testRunId != null && !UUID_RE.test(String(testRunId))) {
      return res.status(400).json({ error: "Invalid testRunId format." });
    }

    const { valid, errors, normalized } = validateConfiguration(configuration);
    if (!valid) {
      return res.status(400).json({
        error: "Invalid configuration.",
        fieldErrors: errors
      });
    }

    const createdTestRunId = await startRun(normalized, null, testRunId || null);
    return res.status(200).json({ testRunId: createdTestRunId });
  } catch (error) {
    // Log server-side detail but never leak internals to the client.
    console.error("[startRun] Failed to start run:", error);
    return res
      .status(500)
      .json({ error: "Could not start the benchmark run. Please try again." });
  }
}
