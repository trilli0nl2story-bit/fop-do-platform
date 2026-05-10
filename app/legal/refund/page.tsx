import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Оплата и возврат — Методический кабинет педагога',
  alternates: { canonical: '/legal/vozvrat' },
  robots: { index: false, follow: true },
};

export default function RefundAliasPage() {
  return <LegalClientWrapper slug="vozvrat" />;
}
