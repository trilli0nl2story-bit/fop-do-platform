import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Авторам — Методический кабинет педагога',
  description: 'Информация для авторов методических материалов и разработок.',
  alternates: { canonical: '/legal/avtory' },
};

export default function AvtoryPage() {
  return <LegalClientWrapper slug="avtory" />;
}
