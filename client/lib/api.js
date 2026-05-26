async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const rawBody = await response.text();
  let payload = null;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    const shortBody = rawBody?.slice(0, 200) || "";
    if (!response.ok) {
      throw new Error(
        `Request failed (${response.status}). Non-JSON response received: ${shortBody}`
      );
    }
    throw new Error("Server returned a non-JSON response.");
  }

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

export async function startRun(configuration) {
  const payload = await requestJson("/api/tests/startRun", {
    method: "POST",
    body: JSON.stringify({ configuration })
  });
  return payload.testRunId;
}

export async function fetchRun(testRunId) {
  const payload = await requestJson(
    `/api/tests/testRun?testRunId=${encodeURIComponent(testRunId)}`
  );
  return payload.testRun;
}

export async function fetchResults(testRunId) {
  const payload = await requestJson(
    `/api/tests/results?testRunId=${encodeURIComponent(testRunId)}`
  );
  return payload.results;
}

export async function fetchLogs(testRunId) {
  const payload = await requestJson(
    `/api/tests/logs?testRunId=${encodeURIComponent(testRunId)}`
  );
  return payload.logs;
}

export async function fetchHistory() {
  const payload = await requestJson("/api/tests/history");
  return payload.testRuns;
}
