import type { Metadata } from 'next';
import { KabinetClient } from './client';

export const metadata: Metadata = {
  title: 'Личный кабинет — Методический кабинет педагога',
  description: 'Управляйте своим аккаунтом, материалами и подпиской.',
  robots: { index: false, follow: false },
};

export default function KabinetPage() {
  return <KabinetClient />;
}
