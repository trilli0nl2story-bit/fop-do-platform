import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Оферта — Методический кабинет педагога',
  description: 'Публичная оферта сервиса Методический кабинет педагога.',
  alternates: { canonical: '/legal/oferta' },
};

export default function OfertaPage() {
  return <LegalClientWrapper slug="oferta" />;
}
