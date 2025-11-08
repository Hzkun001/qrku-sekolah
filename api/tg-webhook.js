// api/tg-webhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // 1) Balas 200 ke Telegram SECEPATNYA biar gak retry & gak peduli 302 downstream
    res.status(200).json({ ok: true });

    // 2) Teruskan payload ke Apps Script /exec (biarkan Node follow 30x redirect)
    const GAS_URL = process.env.GAS_WEBAPP_URL; // isi di Vercel → Settings → Environment Variables
    const SECRET  = process.env.TG_SECRET || ""; // opsional: samakan dengan TELEGRAM_WEBHOOK_SECRET di Apps Script

    await fetch(GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + 'src=tg' + (SECRET ? `&secret=${encodeURIComponent(SECRET)}` : ''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // kirim juga header secret_token agar lolos validasi header di Apps Script (kalau kamu aktifkan)
        ...(SECRET ? { 'X-Telegram-Bot-Api-Secret-Token': SECRET } : {})
      },
      body: JSON.stringify(req.body),
      redirect: 'follow',
    });
  } catch (err) {
    // Demi ketenangan: biarkan Telegram tetap menerima 200 (di atas)
    console.error('tg-webhook proxy error:', err);
  }
}
