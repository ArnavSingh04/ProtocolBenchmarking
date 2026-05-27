import { startRun } from "../../../lib/server/runService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { configuration, testRunId } = req.body || {};
    if (!configuration) {
      return res.status(400).json({ error: "configuration is required" });
    }

    const createdTestRunId = await startRun(configuration, null, testRunId);
    return res.status(200).json({ testRunId: createdTestRunId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
