import type { Metadata } from 'next';
import { Suspense } from 'react';
import { KabinetClient } from './client';

export const metadata: Metadata = {
  title: 'Личный кабинет — Методический кабинет педагога',
  description: 'Управляйте своим аккаунтом, материалами и подпиской.',
  robots: { index: false, follow: false },
};

export default function KabinetPage() {
  return (
    <Suspense fallback={null}>
      <KabinetClient />
    </Suspense>
  );
}
