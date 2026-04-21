import nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  delivered: boolean;
  mode: 'smtp' | 'disabled';
}

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null
  | undefined;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? '587');
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !port || !from) {
    return null;
  }

  return {
    host,
    port,
    secure,
    from,
    auth: user && pass ? { user, pass } : undefined,
  };
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(getSmtpConfig());
}

function getTransporter() {
  if (transporter !== undefined) {
    return transporter;
  }

  const config = getSmtpConfig();
  if (!config) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return transporter;
}

export async function sendEmail(
  payload: EmailPayload
): Promise<EmailSendResult> {
  const config = getSmtpConfig();
  const smtp = getTransporter();

  if (!config || !smtp) {
    console.warn(
      `[email] SMTP is not configured. Email to ${payload.to} was not sent. Subject: ${payload.subject}`
    );
    return { delivered: false, mode: 'disabled' };
  }

  await smtp.sendMail({
    from: config.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  return { delivered: true, mode: 'smtp' };
}
