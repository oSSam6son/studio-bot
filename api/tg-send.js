// api/tg-send.js  (Vercel Function)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { token, method, body } = req.body || {};

  // ⚠️ ПРОВЕРКА — только свой воркер может вызывать
  const SECRET = process.env.VERCEL_TG_SECRET;
  if (!SECRET || req.headers["x-secret"] !== SECRET) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  if (!token || !method || !body) {
    return res.status(400).json({ ok: false, error: "bad_request" });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await tgRes.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}