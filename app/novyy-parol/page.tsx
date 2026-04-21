import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NovyyParolClient } from './client';

export const metadata: Metadata = {
  title: 'Новый пароль — Методический кабинет педагога',
  description: 'Задайте новый пароль для входа в кабинет.',
  robots: { index: false, follow: false },
};

export default function NovyyParolPage() {
  return (
    <Suspense fallback={null}>
      <NovyyParolClient />
    </Suspense>
  );
}
