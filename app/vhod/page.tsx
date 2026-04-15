import type { Metadata } from 'next';
import { VhodClient } from './client';

export const metadata: Metadata = {
  title: 'Вход — Методический кабинет педагога',
  description: 'Вход в личный кабинет педагога.',
  robots: { index: false, follow: false },
};

export default function VhodPage() {
  return <VhodClient />;
}
