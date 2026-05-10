const DEFAULT_SUPPORT_EMAIL = 'official@doshkolnoe-na-lokanichnom.ru';

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

function parseEmailAddress(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const bracketMatch = raw.match(/<([^>]+)>/);
  const candidate = (bracketMatch?.[1] ?? raw).replace(/^mailto:/i, '').trim();
  return candidate.includes('@') ? candidate : null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

export function getServiceEmailSupportAddress(): string {
  return (
    parseEmailAddress(process.env.SUPPORT_EMAIL) ??
    parseEmailAddress(process.env.SMTP_FROM) ??
    parseEmailAddress(process.env.SMTP_USER) ??
    DEFAULT_SUPPORT_EMAIL
  );
}

export function buildServiceEmailTextFooter(origin: string): string[] {
  const appOrigin = normalizeOrigin(origin);
  const supportEmail = getServiceEmailSupportAddress();

  return [
    '---',
    'Это сервисное письмо по вашему аккаунту в проекте «Дошкольное на лаконичном».',
    `Поддержка: ${supportEmail}`,
    `Юридические документы: ${appOrigin}/legal`,
    `Политика персональных данных: ${appOrigin}/legal/konfidentsialnost`,
    `Публичная оферта: ${appOrigin}/legal/oferta`,
    `Оплата и возврат: ${appOrigin}/legal/vozvrat`,
    'Если вы не совершали это действие, напишите в поддержку.',
  ];
}

export function buildServiceEmailHtmlFooter(origin: string): string {
  const appOrigin = normalizeOrigin(origin);
  const supportEmail = getServiceEmailSupportAddress();
  const supportEmailHtml = escapeHtml(supportEmail);

  return `
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#6b7280">
        <p style="margin:0 0 8px">
          Это сервисное письмо по вашему аккаунту в проекте «Дошкольное на лаконичном».
          Если вы не совершали это действие, напишите в поддержку.
        </p>
        <p style="margin:0 0 8px">
          Поддержка:
          <a href="mailto:${supportEmailHtml}" style="color:#2563eb;text-decoration:none">${supportEmailHtml}</a>
        </p>
        <p style="margin:0">
          <a href="${appOrigin}/legal" style="color:#2563eb;text-decoration:none">Юридические документы</a>
          ·
          <a href="${appOrigin}/legal/konfidentsialnost" style="color:#2563eb;text-decoration:none">Политика персональных данных</a>
          ·
          <a href="${appOrigin}/legal/oferta" style="color:#2563eb;text-decoration:none">Публичная оферта</a>
          ·
          <a href="${appOrigin}/legal/vozvrat" style="color:#2563eb;text-decoration:none">Оплата и возврат</a>
        </p>
      </div>
  `;
}
