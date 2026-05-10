import type { Metadata } from 'next';
import { Suspense } from 'react';
import { KabinetClient } from '../kabinet/client';

export const metadata: Metadata = {
  title: 'Профиль — Методический кабинет педагога',
  description: 'Данные аккаунта, подтверждение почты и безопасность входа.',
  robots: { index: false, follow: false },
};

export default function ProfilPage() {
  return (
    <Suspense fallback={null}>
      <KabinetClient section="profile" />
    </Suspense>
  );
}
