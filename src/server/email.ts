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

export interface EmailDeliveryDiagnostics {
  configured: boolean;
  secure: boolean;
  present: {
    host: boolean;
    port: boolean;
    user: boolean;
    pass: boolean;
    from: boolean;
  };
  missingKeys: string[];
  warnings: string[];
}

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null
  | undefined;

function hasEmailAddress(value: string): boolean {
  return /[^\s<>@]+@[^\s<>@]+/.test(value);
}

export function getEmailDeliveryDiagnostics(): EmailDeliveryDiagnostics {
  const host = process.env.SMTP_HOST?.trim();
  const rawPort = process.env.SMTP_PORT?.trim();
  const port = Number(rawPort);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const missingKeys: string[] = [];
  const warnings: string[] = [];

  if (!host) missingKeys.push('SMTP_HOST');
  if (!rawPort || !Number.isFinite(port) || port <= 0) missingKeys.push('SMTP_PORT');
  if (!user) missingKeys.push('SMTP_USER');
  if (!pass) missingKeys.push('SMTP_PASS');
  if (!from) missingKeys.push('SMTP_FROM');
  if (from && !hasEmailAddress(from)) {
    missingKeys.push('SMTP_FROM/email');
    warnings.push('SMTP_FROM должен быть email или строкой вида "Имя <email@domain.ru>".');
  }
  if (port === 465 && process.env.SMTP_SECURE !== 'true') {
    warnings.push('Для порта 465 лучше явно задать SMTP_SECURE=true.');
  }

  return {
    configured: missingKeys.length === 0,
    secure,
    present: {
      host: Boolean(host),
      port: Boolean(rawPort) && Number.isFinite(port) && port > 0,
      user: Boolean(user),
      pass: Boolean(pass),
      from: Boolean(from),
    },
    missingKeys,
    warnings,
  };
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const rawPort = process.env.SMTP_PORT?.trim();
  const port = Number(rawPort);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const diagnostics = getEmailDeliveryDiagnostics();

  if (!diagnostics.configured || !host || !rawPort || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure,
    from,
    auth: { user, pass },
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
