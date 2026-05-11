import { domainToASCII } from 'node:url';
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
  transport: EmailTransportDiagnostics | null;
}

export interface EmailTransportDiagnostics {
  messageId: string | null;
  response: string | null;
  accepted: string[];
  rejected: string[];
  pending: string[];
  headerFrom: string | null;
  envelopeFrom: string | null;
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

export interface EmailFailureDiagnostics {
  code: string | null;
  command: string | null;
  responseCode: number | null;
  response: string | null;
  hint: string;
}

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null
  | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 10);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeSmtpText(value: string | null): string | null {
  if (!value) return null;
  let safe = value.replace(/\s+/g, ' ').trim();
  const secrets = [process.env.SMTP_PASS?.trim()].filter(
    (secret): secret is string => Boolean(secret && secret.length >= 4)
  );

  for (const secret of secrets) {
    safe = safe.replace(new RegExp(escapeRegExp(secret), 'g'), '[hidden]');
  }

  return safe.length > 240 ? `${safe.slice(0, 240)}...` : safe;
}

function getSmtpFailureHint({
  code,
  command,
  responseCode,
  response,
}: {
  code: string | null;
  command: string | null;
  responseCode: number | null;
  response: string | null;
}) {
  const normalized = `${code ?? ''} ${command ?? ''} ${responseCode ?? ''} ${response ?? ''}`.toLowerCase();

  if (
    code === 'EAUTH' ||
    responseCode === 534 ||
    responseCode === 535 ||
    normalized.includes('auth') ||
    normalized.includes('authentication') ||
    normalized.includes('login') ||
    normalized.includes('password')
  ) {
    return 'Проверьте SMTP_USER и SMTP_PASS: для Яндекса нужен пароль приложения именно от этого ящика, а не обычный пароль аккаунта.';
  }

  if (
    command === 'MAIL' ||
    responseCode === 550 ||
    responseCode === 551 ||
    responseCode === 553 ||
    responseCode === 554 ||
    normalized.includes('sender') ||
    normalized.includes('from') ||
    normalized.includes('relay')
  ) {
    return 'Проверьте SMTP_FROM: адрес отправителя должен совпадать с SMTP_USER или быть разрешённым алиасом этого домена.';
  }

  if (
    code === 'ESOCKET' ||
    code === 'ECONNECTION' ||
    code === 'ETIMEDOUT' ||
    normalized.includes('certificate') ||
    normalized.includes('timeout') ||
    normalized.includes('ssl') ||
    normalized.includes('tls')
  ) {
    return 'Проверьте SMTP_HOST, SMTP_PORT и SMTP_SECURE. Для порта 465 задайте SMTP_SECURE=true отдельным секретом.';
  }

  return 'Откройте логи Replit и сравните код/ответ SMTP. Секреты не выводятся, но код ошибки обычно показывает, что именно отклонил почтовый сервер.';
}

function hasEmailAddress(value: string): boolean {
  return /[^\s<>@]+@[^\s<>@]+/.test(value);
}

function extractEmailAddress(value: string | undefined): string | null {
  if (!value) return null;
  const angleMatch = value.match(/<\s*([^<>\s]+@[^<>\s]+)\s*>/);
  const plainMatch = value.match(/[^\s<>]+@[^\s<>]+/);
  return (angleMatch?.[1] ?? plainMatch?.[0] ?? null)?.trim() ?? null;
}

function extractDisplayName(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^\s*(.*?)\s*<[^<>]+>\s*$/);
  if (!match) return null;

  const name = match[1]
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

  if (!name || name.includes('@')) return null;
  return name;
}

function normalizeEmailDomainToAscii(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return null;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const asciiDomain = domainToASCII(domain);

  if (!local || !asciiDomain) return null;
  return `${local}@${asciiDomain}`;
}

export function getEmailFailureDiagnostics(error: unknown): EmailFailureDiagnostics {
  const record = isRecord(error) ? error : {};
  const code = asString(record.code);
  const command = asString(record.command);
  const responseCode = asNumber(record.responseCode);
  const response = safeSmtpText(
    asString(record.response) ??
      (error instanceof Error ? error.message : asString(record.message))
  );

  return {
    code,
    command,
    responseCode,
    response,
    hint: getSmtpFailureHint({ code, command, responseCode, response }),
  };
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
  const fromAddress = normalizeEmailDomainToAscii(
    extractEmailAddress(from) ?? extractEmailAddress(user)
  );
  const fromName =
    process.env.SMTP_FROM_NAME?.trim() ||
    extractDisplayName(from) ||
    'Методический кабинет педагога';
  const envelopeFrom = normalizeEmailDomainToAscii(
    extractEmailAddress(process.env.SMTP_ENVELOPE_FROM?.trim()) ??
      fromAddress
  );
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const diagnostics = getEmailDeliveryDiagnostics();

  if (!diagnostics.configured || !host || !rawPort || !port || !user || !pass || !from || !fromAddress || !envelopeFrom) {
    return null;
  }

  return {
    host,
    port,
    secure,
    from: {
      name: fromName,
      address: fromAddress,
    },
    headerFrom: `${fromName} <${fromAddress}>`,
    envelopeFrom,
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
    return { delivered: false, mode: 'disabled', transport: null };
  }

  const info = await smtp.sendMail({
    from: config.from,
    to: payload.to,
    envelope: {
      from: config.envelopeFrom,
      to: payload.to,
    },
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
  const infoRecord: Record<string, unknown> = isRecord(info) ? info : {};
  const accepted = asStringArray(infoRecord.accepted);
  const rejected = asStringArray(infoRecord.rejected);
  const pending = asStringArray(infoRecord.pending);

  return {
    delivered: accepted.length > 0 && rejected.length === 0,
    mode: 'smtp',
    transport: {
      messageId: asString(infoRecord.messageId),
      response: safeSmtpText(asString(infoRecord.response)),
      accepted,
      rejected,
      pending,
      headerFrom: config.headerFrom,
      envelopeFrom: config.envelopeFrom,
    },
  };
}
