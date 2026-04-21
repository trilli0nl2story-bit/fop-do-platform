import type { Metadata } from 'next';
import { VosstanovlenieParolyaClient } from './client';

export const metadata: Metadata = {
  title: 'Восстановление пароля — Методический кабинет педагога',
  description: 'Запросите письмо для безопасной смены пароля.',
  robots: { index: false, follow: false },
};

export default function VosstanovlenieParolyaPage() {
  return <VosstanovlenieParolyaClient />;
}
