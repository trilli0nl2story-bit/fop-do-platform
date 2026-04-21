import type { Metadata } from 'next';
import { ZakazatDokumentClient } from './client';

export const metadata: Metadata = {
  title: 'Заказать документ — Методический кабинет педагога',
  description:
    'Оставьте заявку на индивидуальный документ или материал для детского сада. Опишите тему, возраст и формат — мы сохраним запрос и покажем его статус в кабинете.',
  alternates: { canonical: '/zakazat-dokument' },
};

export default function ZakazatDokumentPage() {
  return <ZakazatDokumentClient />;
}
