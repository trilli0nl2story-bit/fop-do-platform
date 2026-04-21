import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VhodClient } from './client';

export const metadata: Metadata = {
  title: 'Вход — Методический кабинет педагога',
  description: 'Вход в личный кабинет педагога.',
  robots: { index: false, follow: false },
};

export default function VhodPage() {
  return (
    <Suspense fallback={null}>
      <VhodClient />
    </Suspense>
  );
}
