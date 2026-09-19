import { proxyToWorker } from "../_proxy.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "method_not_allowed" });
    }
    return proxyToWorker(req, res, "/api/admin/open-hours");
}