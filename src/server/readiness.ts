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

function hasSessionSecret(): boolean {
  return Boolean(process.env.SESSION_SECRET?.trim());
}

function hasAppOrigin(): boolean {
  return Boolean(process.env.APP_ORIGIN?.trim());
}

export async function getReleaseReadinessSummary(): Promise<ReadinessSummary> {
  const databaseReady = await ping();

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
      configured: hasAppOrigin(),
      required: true,
      message: hasAppOrigin()
        ? 'Базовый домен приложения задан.'
        : 'APP_ORIGIN ещё не задан. Это важно для писем, webhook и origin-проверок.',
    },
    {
      key: 'session_secret',
      label: 'SESSION_SECRET',
      configured: hasSessionSecret(),
      required: true,
      message: hasSessionSecret()
        ? 'Секрет сессий задан.'
        : 'SESSION_SECRET не задан.',
    },
    {
      key: 'prodamus',
      label: 'Prodamus',
      configured: isProdamusConfigured(),
      required: true,
      message: isProdamusConfigured()
        ? 'Оплата через Prodamus настроена.'
        : 'Для оплаты не хватает PRODAMUS_PAYFORM_URL и/или PRODAMUS_SECRET_KEY.',
    },
    {
      key: 'smtp',
      label: 'SMTP-почта',
      configured: isEmailDeliveryConfigured(),
      required: true,
      message: isEmailDeliveryConfigured()
        ? 'Почта для подтверждений и восстановления пароля настроена.'
        : 'SMTP ещё не подключён.',
    },
    {
      key: 'storage',
      label: 'Файловое хранилище',
      configured: isStorageConfigured(),
      required: true,
      message: isStorageConfigured()
        ? 'S3-совместимое хранилище настроено.'
        : 'S3-хранилище ещё не настроено.',
    },
    {
      key: 'openai',
      label: 'OpenAI / AI-помощник',
      configured: isAssistantConfigured(),
      required: true,
      message: isAssistantConfigured()
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
