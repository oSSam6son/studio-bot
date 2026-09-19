import { proxyToWorker } from "./_proxy.js";

export default async function handler(req, res) {
    return proxyToWorker(req, res, "/api/booked-dates");
}