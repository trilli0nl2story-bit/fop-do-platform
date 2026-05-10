import type { Metadata } from 'next';
import { LegalClientWrapper } from '../LegalClientWrapper';

export const metadata: Metadata = {
  title: 'Правила AI-помощника — Методический кабинет педагога',
  alternates: { canonical: '/legal/ai-rules' },
  robots: { index: false, follow: true },
};

export default function AiRulesPage() {
  return <LegalClientWrapper slug="ai-rules" />;
}
