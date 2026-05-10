import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Согласие на рассылку — Методический кабинет педагога',
  description: 'Черновик согласия на получение информационных и рекламных сообщений проекта.',
  alternates: { canonical: '/legal/marketing-consent' },
  robots: { index: false, follow: true },
};

export default function MarketingConsentPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/legal" className="text-sm font-medium text-gray-500 hover:text-gray-700">
          ← Все документы
        </Link>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Черновик
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Согласие на рассылку
          </h1>
          <div className="mt-6 space-y-4 text-sm leading-6 text-gray-700">
            <p>
              Здесь будет размещен финальный текст согласия на получение информационных
              и рекламных сообщений проекта «Дошкольное на лаконичном».
            </p>
            <p>
              До запуска маркетинговых рассылок владелец проекта должен вставить текст,
              проверенный юристом, и настроить механизм отказа от рассылки.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
