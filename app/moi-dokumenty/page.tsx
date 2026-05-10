import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MoiDokumentyClient } from './client';

export const metadata: Metadata = {
  title: 'Мои материалы — Методический кабинет педагога',
  description: 'Ваши купленные материалы, документы по подписке и ссылки на скачивание.',
  robots: { index: false, follow: false },
};

export default function MoiDokumentyPage() {
  return (
    <Suspense fallback={null}>
      <MoiDokumentyClient />
    </Suspense>
  );
}
