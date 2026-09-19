import { proxyToWorker } from "../_proxy.js";

export default async function handler(req, res) {
    const password = req.query.password || "";
    return proxyToWorker(
        req,
        res,
        `/api/admin/check?password=${encodeURIComponent(password)}`
    );
}