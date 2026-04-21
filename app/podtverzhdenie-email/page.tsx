import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PodtverzhdenieEmailClient } from './client';

export const metadata: Metadata = {
  title: 'Подтверждение email — Методический кабинет педагога',
  description: 'Подтвердите email, чтобы завершить настройку аккаунта.',
  robots: { index: false, follow: false },
};

export default function PodtverzhdenieEmailPage() {
  return (
    <Suspense fallback={null}>
      <PodtverzhdenieEmailClient />
    </Suspense>
  );
}
