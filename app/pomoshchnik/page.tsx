import type { Metadata } from 'next';
import { PomoshchnikClient } from './client';

export const metadata: Metadata = {
  title: 'AI-помощник — Методический кабинет педагога',
  description:
    'Задавайте практические вопросы по документам, занятиям, планированию и работе с родителями. AI-помощник доступен по подписке.',
  robots: { index: false, follow: false },
};

export default function PomoshchnikPage() {
  return <PomoshchnikClient />;
}
