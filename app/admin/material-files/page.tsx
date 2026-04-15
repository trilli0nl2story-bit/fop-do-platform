import type { Metadata } from 'next';
import { AdminMaterialFilesClient } from './client';

export const metadata: Metadata = {
  title: 'Файлы материалов — Администрирование',
  robots: { index: false, follow: false },
};

export default function AdminMaterialFilesPage() {
  return <AdminMaterialFilesClient />;
}
