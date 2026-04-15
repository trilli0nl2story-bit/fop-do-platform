import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — Методический кабинет педагога',
  description: 'Политика обработки персональных данных и конфиденциальности сервиса.',
  alternates: { canonical: '/legal/konfidentsialnost' },
};

export default function KonfidentsialnostPage() {
  return <LegalClientWrapper slug="konfidentsialnost" />;
}
