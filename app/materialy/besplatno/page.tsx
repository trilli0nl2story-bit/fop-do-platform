import type { Metadata } from 'next';
import { BesplatnoClient } from './client';

export const metadata: Metadata = {
  title: 'Бесплатные материалы для воспитателей ДОУ',
  description:
    'Бесплатные методические материалы, разработки и документы для педагогов дошкольного образования.',
  alternates: { canonical: '/materialy/besplatno' },
};

export default function BesplatnoPage() {
  return <BesplatnoClient />;
}
