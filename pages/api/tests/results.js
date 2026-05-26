import { getRunResults } from "../../../lib/server/runService";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const testRunId = req.query.testRunId;
  if (!testRunId) {
    return res.status(400).json({ error: "testRunId is required" });
  }

  const results = await getRunResults(testRunId);
  return res.status(200).json({ results });
}
