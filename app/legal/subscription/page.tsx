import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Условия подписки — Методический кабинет педагога',
  alternates: { canonical: '/legal/subscription' },
  robots: { index: false, follow: true },
};

export default function SubscriptionTermsPage() {
  return <LegalClientWrapper slug="subscription" />;
}
