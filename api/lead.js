// Serverless function (Vercel): receives the company-payment request form
// and forwards it to Telegram via a bot. Configure two env vars in Vercel:
//   TELEGRAM_BOT_TOKEN — token from @BotFather
//   TELEGRAM_CHAT_ID   — your chat id (from @userinfobot)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  // honeypot — bots fill hidden fields; humans don't
  if (b.website) return res.status(200).json({ ok: true });

  const name = (b.name || '').toString().slice(0, 200);
  const company = (b.company || '').toString().slice(0, 200);
  const email = (b.email || '').toString().slice(0, 200);
  const count = (b.count || '').toString().slice(0, 100);
  const comment = (b.comment || '').toString().slice(0, 1000);

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  const text =
    '🟣 Заявка на курс — оплата от компании\n\n' +
    '👤 Имя: ' + name + '\n' +
    '🏢 Компания: ' + company + '\n' +
    '✉️ Email: ' + email + '\n' +
    '👥 Сотрудников: ' + (count || '—') + '\n' +
    '💬 Комментарий: ' + (comment || '—');

  try {
    const tg = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!tg.ok) {
      return res.status(502).json({ ok: false, error: 'telegram_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'telegram_error' });
  }
}
