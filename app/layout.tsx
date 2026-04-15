import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Методический кабинет педагога',
  description:
    'Готовые методические материалы для воспитателей и педагогов дошкольных учреждений — конспекты занятий, КТП, рабочие программы по ФОП ДО.',
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
