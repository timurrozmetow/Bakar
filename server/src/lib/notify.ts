import nodemailer from 'nodemailer';

interface PartnerRequestPayload {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
}

const tg = {
  token: process.env.TELEGRAM_BOT_TOKEN ?? '',
  chatId: process.env.TELEGRAM_CHAT_ID ?? '',
};

const smtp = {
  host: process.env.SMTP_HOST ?? '',
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  to: process.env.NOTIFY_EMAIL_TO ?? '',
  from: process.env.NOTIFY_EMAIL_FROM || process.env.SMTP_USER || '',
};

function formatText(r: PartnerRequestPayload): string {
  return [
    '🌾 Новая заявка с сайта BAKAR',
    '',
    `Имя: ${r.name}`,
    r.company ? `Компания: ${r.company}` : '',
    r.phone ? `Телефон: ${r.phone}` : '',
    r.email ? `E-mail: ${r.email}` : '',
    r.message ? `\nСообщение:\n${r.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendTelegram(text: string): Promise<void> {
  if (!tg.token || !tg.chatId) return;
  const res = await fetch(`https://api.telegram.org/bot${tg.token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: tg.chatId, text }),
  });
  if (!res.ok) throw new Error(`Telegram responded ${res.status}`);
}

async function sendEmail(text: string): Promise<void> {
  if (!smtp.host || !smtp.to) return;
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
  await transport.sendMail({
    from: smtp.from,
    to: smtp.to,
    subject: 'Новая заявка с сайта BAKAR',
    text,
  });
}

/**
 * Fire-and-forget notification for a new partner request.
 * Each channel is optional (configured via .env) and a failure here must never
 * break the visitor's form submission — errors are logged only.
 */
export function notifyPartnerRequest(request: PartnerRequestPayload): void {
  const text = formatText(request);
  void Promise.allSettled([sendTelegram(text), sendEmail(text)]).then((results) => {
    for (const r of results) {
      if (r.status === 'rejected') console.error('[notify]', r.reason);
    }
  });
}

/** True when at least one notification channel is configured. */
export const notificationsEnabled = Boolean((tg.token && tg.chatId) || (smtp.host && smtp.to));
