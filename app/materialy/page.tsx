import type { Metadata } from 'next';
import { MaterialyClient } from './client';

export const metadata: Metadata = {
  title: 'Методические материалы для педагогов ДОУ',
  description:
    'Бесплатные материалы, документы по подписке и магазин готовых разработок для воспитателей и специалистов ДОУ.',
  alternates: { canonical: '/materialy' },
};

export default function MaterialyPage() {
  return <MaterialyClient />;
}
