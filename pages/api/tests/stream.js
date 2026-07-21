import { runEventBus } from "../../../lib/server/eventBus";
import {
  getRunById,
  getRunLogs,
  getRunResults
} from "../../../lib/server/runService";
import { isValidRunId } from "../../../imports/shared/validation";

export const config = {
  api: {
    bodyParser: false
  }
};

function writeEvent(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const testRunId = req.query.testRunId;
  if (!isValidRunId(testRunId)) {
    return res.status(400).json({ error: "A valid testRunId is required" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  const [testRun, results, logs] = await Promise.all([
    getRunById(testRunId),
    getRunResults(testRunId),
    getRunLogs(testRunId)
  ]);

  writeEvent(res, {
    type: "snapshot",
    payload: {
      testRun,
      results,
      logs
    }
  });

  const eventName = `run:${testRunId}`;
  const listener = (event) => {
    writeEvent(res, event);
  };

  runEventBus.on(eventName, listener);

  const heartbeat = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    runEventBus.off(eventName, listener);
    res.end();
  });
}
