import type { Metadata } from 'next';
import { StatAvtoromClient } from './client';

export const metadata: Metadata = {
  title: 'Стать автором — Методический кабинет педагога',
  description:
    'Оставьте заявку автора, если хотите публиковать свои методические материалы на платформе. Мы сохраним заявку и вернёмся с ответом после рассмотрения.',
  alternates: { canonical: '/stat-avtorom' },
};

export default function StatAvtoromPage() {
  return <StatAvtoromClient />;
}
