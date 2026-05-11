import { resolveMx, resolveTxt } from 'node:dns/promises';
import { domainToASCII, domainToUnicode } from 'node:url';

export interface EmailDomainReadiness {
  configured: boolean;
  domain: string | null;
  selector: string;
  message: string;
  missing: string[];
  dnsUnavailable: boolean;
  found: {
    mx: boolean;
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    rootDkim: boolean;
  };
}

const DNS_TIMEOUT_MS = 2500;

interface DnsLookupResult<T> {
  value: T;
  unavailable: boolean;
}

function extractEmailAddress(value: string | undefined): string | null {
  if (!value) return null;
  const angleMatch = value.match(/<\s*([^<>\s]+@[^<>\s]+)\s*>/);
  const plainMatch = value.match(/[^\s<>]+@[^\s<>]+/);
  return (angleMatch?.[1] ?? plainMatch?.[0] ?? null)?.trim() ?? null;
}

function getEmailDomain(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return null;

  const asciiDomain = domainToASCII(email.slice(at + 1));
  return asciiDomain ? asciiDomain.toLowerCase() : null;
}

function getConfiguredSenderDomain(): string | null {
  return getEmailDomain(
    extractEmailAddress(process.env.SMTP_FROM?.trim()) ??
      extractEmailAddress(process.env.SMTP_USER?.trim()) ??
      extractEmailAddress(process.env.SMTP_ENVELOPE_FROM?.trim())
  );
}

function getDkimSelector(): string {
  return process.env.SMTP_DKIM_SELECTOR?.trim() || 'mail';
}

function isDnsUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  const code = String((error as { code?: unknown }).code);
  return ['ECONNREFUSED', 'ETIMEOUT', 'EAI_AGAIN'].includes(code);
}

async function withDnsLookup<T>(operation: Promise<T>, fallback: T): Promise<DnsLookupResult<T>> {
  let timedOut = false;
  const value = await Promise.race([
    operation.catch((error) => {
      if (isDnsUnavailable(error)) timedOut = true;
      return fallback;
    }),
    new Promise<T>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve(fallback);
      }, DNS_TIMEOUT_MS);
    }),
  ]);

  return {
    value,
    unavailable: timedOut,
  };
}

async function resolveTxtRecords(name: string): Promise<DnsLookupResult<string[]>> {
  return withDnsLookup(
    resolveTxt(name).then((records) =>
      records
        .map((parts) => parts.join('').trim())
        .filter(Boolean)
    ),
    []
  );
}

async function hasMxRecord(domain: string): Promise<DnsLookupResult<boolean>> {
  const records = await withDnsLookup(resolveMx(domain), []);
  return {
    value: records.value.length > 0,
    unavailable: records.unavailable,
  };
}

function hasRecord(records: string[], prefix: string): boolean {
  const normalizedPrefix = prefix.toLowerCase();
  return records.some((record) => record.toLowerCase().startsWith(normalizedPrefix));
}

function getMessage({
  domain,
  selector,
  configured,
  missing,
  rootDkim,
  dnsUnavailable,
}: {
  domain: string;
  selector: string;
  configured: boolean;
  missing: string[];
  rootDkim: boolean;
  dnsUnavailable: boolean;
}): string {
  const visibleDomain = domainToUnicode(domain) || domain;

  if (dnsUnavailable) {
    return `Почтовый домен ${visibleDomain} не удалось проверить: DNS-запросы временно не ответили. Повторите проверку позже или проверьте DNS в Яндекс 360.`;
  }

  if (configured) {
    return `Почтовый домен ${visibleDomain} готов: MX, SPF, DKIM и DMARC найдены.`;
  }

  const base = `Почтовый домен ${visibleDomain} пока не готов к стабильной доставке. Не хватает: ${missing.join(', ')}.`;

  if (rootDkim && missing.some((item) => item.startsWith('DKIM'))) {
    return `${base} DKIM похож на запись в корне домена, но для Яндекс 360 обычно нужен хост ${selector}._domainkey.`;
  }

  return base;
}

export async function getEmailDomainReadiness(): Promise<EmailDomainReadiness> {
  const domain = getConfiguredSenderDomain();
  const selector = getDkimSelector();

  if (!domain) {
    return {
      configured: false,
      domain: null,
      selector,
      message: 'Почтовый домен не проверен: не удалось определить домен из SMTP_FROM, SMTP_USER или SMTP_ENVELOPE_FROM.',
      missing: ['domain'],
      dnsUnavailable: false,
      found: {
        mx: false,
        spf: false,
        dkim: false,
        dmarc: false,
        rootDkim: false,
      },
    };
  }

  const [mxReady, rootTxt, dkimTxt, dmarcTxt] = await Promise.all([
    hasMxRecord(domain),
    resolveTxtRecords(domain),
    resolveTxtRecords(`${selector}._domainkey.${domain}`),
    resolveTxtRecords(`_dmarc.${domain}`),
  ]);

  const dnsUnavailable = mxReady.unavailable || rootTxt.unavailable || dkimTxt.unavailable || dmarcTxt.unavailable;
  const spfReady = hasRecord(rootTxt.value, 'v=spf1');
  const rootDkimReady = hasRecord(rootTxt.value, 'v=DKIM1');
  const dkimReady = hasRecord(dkimTxt.value, 'v=DKIM1');
  const dmarcReady = hasRecord(dmarcTxt.value, 'v=DMARC1');
  const missing: string[] = [];

  if (!mxReady.value) missing.push('MX');
  if (!spfReady) missing.push('SPF');
  if (!dkimReady) missing.push(`DKIM (${selector}._domainkey)`);
  if (!dmarcReady) missing.push('DMARC (_dmarc)');

  const configured = missing.length === 0;

  return {
    configured,
    domain,
    selector,
    message: getMessage({
      domain,
      selector,
      configured,
      missing,
      rootDkim: rootDkimReady,
      dnsUnavailable,
    }),
    missing,
    dnsUnavailable,
    found: {
      mx: mxReady.value,
      spf: spfReady,
      dkim: dkimReady,
      dmarc: dmarcReady,
      rootDkim: rootDkimReady,
    },
  };
}
