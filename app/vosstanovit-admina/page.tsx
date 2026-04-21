import type { Metadata } from 'next';
import { VosstanovitAdminaClient } from './client';

export const metadata: Metadata = {
  title: 'Восстановление админ-доступа — Методический кабинет педагога',
  description: 'Аварийное восстановление доступа к админке.',
  robots: { index: false, follow: false },
};

export default function VosstanovitAdminaPage() {
  return <VosstanovitAdminaClient />;
}
