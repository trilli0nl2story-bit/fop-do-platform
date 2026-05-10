import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение — Методический кабинет педагога',
  alternates: { canonical: '/legal/usloviya' },
  robots: { index: false, follow: true },
};

export default function TermsAliasPage() {
  return <LegalClientWrapper slug="usloviya" />;
}
