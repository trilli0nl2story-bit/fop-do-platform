import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных — Методический кабинет педагога',
  alternates: { canonical: '/legal/soglasie' },
  robots: { index: false, follow: true },
};

export default function PersonalDataConsentAliasPage() {
  return <LegalClientWrapper slug="soglasie" />;
}
