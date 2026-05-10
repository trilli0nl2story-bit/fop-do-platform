import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Для авторов — Методический кабинет педагога',
  alternates: { canonical: '/legal/avtory' },
  robots: { index: false, follow: true },
};

export default function AuthorsAliasPage() {
  return <LegalClientWrapper slug="avtory" />;
}
