import type { Metadata } from 'next';
import { siteUrl, siteName } from '../src/lib/siteConfig';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteName,
  description:
    'Готовые методические материалы для воспитателей и педагогов дошкольных учреждений — конспекты занятий, КТП, рабочие программы по ФОП ДО.',
  alternates: { canonical: '/' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
