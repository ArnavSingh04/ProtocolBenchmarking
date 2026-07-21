import { getRunById } from "../../../lib/server/runService";
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
    const testRun = await getRunById(testRunId);
    return res.status(200).json({ testRun: testRun || null });
  } catch (error) {
    console.error("[testRun] lookup failed:", error);
    return res.status(500).json({ error: "Could not load the test run." });
  }
}
