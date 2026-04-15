import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Правила возврата — Методический кабинет педагога',
  description: 'Информация о порядке возврата и отмены покупки.',
  alternates: { canonical: '/legal/vozvrat' },
};

export default function VozvratPage() {
  return <LegalClientWrapper slug="vozvrat" />;
}
