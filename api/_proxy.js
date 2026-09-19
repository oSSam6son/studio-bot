// api/_proxy.js
const WORKER_URL = "https://flstudio-bot.flstudio.workers.dev";

export async function proxyToWorker(req, res, workerPath) {
    try {
        const initData = req.headers["x-telegram-init-data"] || "";

        const headers = {
            "Content-Type": "application/json",
        };
        if (initData) headers["X-Telegram-Init-Data"] = initData;

        const fetchOptions = {
            method: req.method,
            headers,
        };

        // Для POST/PUT — пробрасываем body
        if (req.method === "POST" || req.method === "PUT") {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(`${WORKER_URL}${workerPath}`, fetchOptions);
        const data = await response.json();

        res.status(response.status).json(data);
    } catch (e) {
        console.error("Proxy error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
}