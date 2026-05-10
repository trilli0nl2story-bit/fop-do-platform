import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Политика cookie — Методический кабинет педагога',
  description: 'Описание обязательных, аналитических и рекламных cookie проекта.',
  alternates: { canonical: '/legal/cookie-policy' },
};

export default function CookiePolicyPage() {
  return <LegalClientWrapper slug="cookie-policy" />;
}
