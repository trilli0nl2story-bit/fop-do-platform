import { ping } from './db';
import { isEmailDeliveryConfigured } from './email';
import { isProdamusConfigured } from './prodamus';
import { isStorageConfigured } from './storage';
import { isAssistantConfigured } from './aiAssistant';

export interface ReadinessCheck {
  key: string;
  label: string;
  configured: boolean;
  required: boolean;
  message: string;
}

export interface ReadinessSummary {
  readyCount: number;
  totalCount: number;
  requiredReadyCount: number;
  requiredTotalCount: number;
  checks: ReadinessCheck[];
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function hasSessionSecret(): boolean {
  return Boolean(process.env.SESSION_SECRET?.trim());
}

function hasAppOrigin(): boolean {
  return Boolean(process.env.APP_ORIGIN?.trim());
}

function getConfiguredPublicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || '';
}

function hasPublicSiteUrl(): boolean {
  return Boolean(getConfiguredPublicSiteUrl());
}

function doesPublicSiteUrlMatchAppOrigin(): boolean {
  const appOrigin = process.env.APP_ORIGIN?.trim();
  const publicSiteUrl = getConfiguredPublicSiteUrl();

  if (!appOrigin || !publicSiteUrl) return false;
  return normalizeUrl(appOrigin) === normalizeUrl(publicSiteUrl);
}

export async function getReleaseReadinessSummary(): Promise<ReadinessSummary> {
  const databaseReady = await ping();
  const appOriginConfigured = hasAppOrigin();
  const publicSiteUrlConfigured = hasPublicSiteUrl();
  const siteOriginMatch = doesPublicSiteUrlMatchAppOrigin();
  const sessionSecretConfigured = hasSessionSecret();
  const prodamusConfigured = isProdamusConfigured();
  const smtpConfigured = isEmailDeliveryConfigured();
  const storageConfigured = isStorageConfigured();
  const openAiConfigured = isAssistantConfigured();

  const checks: ReadinessCheck[] = [
    {
      key: 'database',
      label: 'База данных',
      configured: databaseReady,
      required: true,
      message: databaseReady
        ? 'Соединение с PostgreSQL работает.'
        : 'База не отвечает или DATABASE_URL настроен неверно.',
    },
    {
      key: 'app_origin',
      label: 'APP_ORIGIN',
      configured: appOriginConfigured,
      required: true,
      message: appOriginConfigured
        ? 'Базовый домен приложения задан.'
        : 'APP_ORIGIN ещё не задан. Это важно для писем, webhook и origin-проверок.',
    },
    {
      key: 'public_site_url',
      label: 'SITE_URL / NEXT_PUBLIC_SITE_URL',
      configured: publicSiteUrlConfigured,
      required: true,
      message: publicSiteUrlConfigured
        ? 'Публичный адрес сайта задан для sitemap, canonical и реферальных ссылок.'
        : 'Не задан SITE_URL или NEXT_PUBLIC_SITE_URL. Без этого публичные ссылки и SEO могут остаться на staging-домене.',
    },
    {
      key: 'site_origin_match',
      label: 'Совпадение SITE_URL и APP_ORIGIN',
      configured: siteOriginMatch,
      required: true,
      message: siteOriginMatch
        ? 'Публичный домен и APP_ORIGIN совпадают.'
        : 'SITE_URL/NEXT_PUBLIC_SITE_URL и APP_ORIGIN не совпадают. Это риск для canonical, sitemap, писем и возврата после оплаты.',
    },
    {
      key: 'session_secret',
      label: 'SESSION_SECRET',
      configured: sessionSecretConfigured,
      required: true,
      message: sessionSecretConfigured
        ? 'Секрет сессий задан.'
        : 'SESSION_SECRET не задан.',
    },
    {
      key: 'prodamus',
      label: 'Prodamus',
      configured: prodamusConfigured,
      required: true,
      message: prodamusConfigured
        ? 'Оплата через Prodamus настроена.'
        : 'Для оплаты не хватает PRODAMUS_PAYFORM_URL и/или PRODAMUS_SECRET_KEY.',
    },
    {
      key: 'smtp',
      label: 'SMTP-почта',
      configured: smtpConfigured,
      required: true,
      message: smtpConfigured
        ? 'Почта для подтверждений и восстановления пароля настроена.'
        : 'SMTP ещё не подключён.',
    },
    {
      key: 'storage',
      label: 'Файловое хранилище',
      configured: storageConfigured,
      required: true,
      message: storageConfigured
        ? 'S3-совместимое хранилище настроено.'
        : 'S3-хранилище ещё не настроено.',
    },
    {
      key: 'openai',
      label: 'OpenAI / AI-помощник',
      configured: openAiConfigured,
      required: true,
      message: openAiConfigured
        ? 'AI-помощник может отвечать пользователям.'
        : 'OPENAI_API_KEY ещё не задан.',
    },
  ];

  const readyCount = checks.filter((check) => check.configured).length;
  const requiredChecks = checks.filter((check) => check.required);
  const requiredReadyCount = requiredChecks.filter((check) => check.configured).length;

  return {
    readyCount,
    totalCount: checks.length,
    requiredReadyCount,
    requiredTotalCount: requiredChecks.length,
    checks,
  };
}
