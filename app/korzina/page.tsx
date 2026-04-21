import type { Metadata } from 'next';
import { KorzinaClient } from './client';

export const metadata: Metadata = {
  title: 'Корзина — Методический кабинет педагога',
  description: 'Корзина выбранных материалов и серверный расчёт итоговой суммы.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: { canonical: '/korzina' },
};

export default function KorzinaPage() {
  return <KorzinaClient />;
}
