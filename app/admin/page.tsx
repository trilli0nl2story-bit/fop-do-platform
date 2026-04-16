import type { Metadata } from 'next';
import { AdminClient } from './client';

export const metadata: Metadata = {
  title: 'Администрирование',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminClient />;
}
