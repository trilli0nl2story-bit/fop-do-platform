import type { Metadata } from 'next';
import { PodpiskaClient } from './client';

export const metadata: Metadata = {
  title: 'Материалы по подписке для педагогов ДОУ',
  description:
    'Библиотека материалов по подписке: конспекты, КТП, игры, диагностика и документы для педагогов ДОУ.',
};

export default function PodpiskaPage() {
  return <PodpiskaClient />;
}
