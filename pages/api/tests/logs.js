import { getRunLogs } from "../../../lib/server/runService";
import { isValidRunId } from "../../../imports/shared/validation";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const testRunId = req.query.testRunId;
  if (!isValidRunId(testRunId)) {
    return res.status(400).json({ error: "A valid testRunId is required" });
  }

  try {
    const logs = await getRunLogs(testRunId);
    return res.status(200).json({ logs });
  } catch (error) {
    console.error("[logs] lookup failed:", error);
    return res.status(500).json({ error: "Could not load logs." });
  }
}
