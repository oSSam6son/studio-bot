// api/_proxy.js
const WORKER_URL = "https://flstudio-bot.flstudio.workers.dev";

export async function proxyToWorker(req, res, workerPath) {
  try {
    const headers = {
      "Content-Type": "text/plain", // ⭐ text/plain → воркер парсит вручную
    };

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method === "POST" || req.method === "PUT") {
      fetchOptions.body =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(`${WORKER_URL}${workerPath}`, fetchOptions);
    const text = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (e) {
    console.error("Proxy error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
