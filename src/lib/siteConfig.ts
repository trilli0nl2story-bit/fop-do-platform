/**
 * Central site configuration.
 *
 * To switch to the production domain, set the environment variable:
 *   NEXT_PUBLIC_SITE_URL=https://fop-do.ru
 *
 * If the variable is not set, the staging Replit URL is used as fallback.
 */
export const siteUrl: string =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://metodcab.replit.app';

export const siteName = 'Методический кабинет педагога';
export const siteDescription =
  'Готовые методические материалы для воспитателей и педагогов дошкольных учреждений: конспекты занятий, КТП, рабочие программы и подписка по ФОП ДО.';
