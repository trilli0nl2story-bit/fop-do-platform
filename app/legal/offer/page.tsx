import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Публичная оферта — Методический кабинет педагога',
  alternates: { canonical: '/legal/oferta' },
  robots: { index: false, follow: true },
};

export default function OfferAliasPage() {
  return <LegalClientWrapper slug="oferta" />;
}
