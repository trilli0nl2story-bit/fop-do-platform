import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных',
  description: 'Согласие пользователя на обработку персональных данных.',
  alternates: { canonical: '/legal/soglasie' },
};

export default function SoglasiyePage() {
  return <LegalClientWrapper slug="soglasie" />;
}
