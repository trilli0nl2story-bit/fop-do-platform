import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Условия использования — Методический кабинет педагога',
  description: 'Правила использования платформы Методический кабинет педагога.',
  alternates: { canonical: '/legal/usloviya' },
};

export default function UsloviyaPage() {
  return <LegalClientWrapper slug="usloviya" />;
}
