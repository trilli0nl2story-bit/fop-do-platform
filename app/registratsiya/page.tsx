import type { Metadata } from 'next';
import { RegistratsiyaClient } from './client';

export const metadata: Metadata = {
  title: 'Регистрация — Методический кабинет педагога',
  description: 'Создайте кабинет педагога для доступа к материалам и скачиванию.',
  robots: { index: false, follow: false },
};

export default function RegistratsiyaPage() {
  return <RegistratsiyaClient />;
}
