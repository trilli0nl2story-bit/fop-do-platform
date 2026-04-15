import type { Metadata } from 'next';
import { MagazinClient } from './client';

export const metadata: Metadata = {
  title: 'Магазин документов и материалов для ДОУ',
  description:
    'Готовые документы, КТП, конспекты и методические материалы для детского сада с быстрым доступом после оплаты.',
  alternates: { canonical: '/materialy/magazin' },
};

export default function MagazinPage() {
  return <MagazinClient />;
}
