import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PodpiskaCheckoutClient } from './client';

export const metadata: Metadata = {
  title: 'Оформить подписку — Методический кабинет педагога',
  description: 'Оформление подписки на платформу с доступом к библиотеке материалов и скидкой на покупки.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PodpiskaCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <PodpiskaCheckoutClient />
    </Suspense>
  );
}
