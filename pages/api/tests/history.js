import { getHistory } from "../../../lib/server/runService";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const testRuns = await getHistory();
  return res.status(200).json({ testRuns });
}
