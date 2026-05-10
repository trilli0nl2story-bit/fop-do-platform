import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных — Методический кабинет педагога',
  alternates: { canonical: '/legal/konfidentsialnost' },
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyAliasPage() {
  return <LegalClientWrapper slug="konfidentsialnost" />;
}
