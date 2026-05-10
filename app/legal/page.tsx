import type { Metadata } from 'next';
import Link from 'next/link';

const documents = [
  { title: 'Публичная оферта', href: '/legal/oferta' },
  { title: 'Политика обработки персональных данных', href: '/legal/konfidentsialnost' },
  { title: 'Политика cookie', href: '/legal/cookie-policy' },
  { title: 'Пользовательское соглашение', href: '/legal/usloviya' },
  { title: 'Согласие на обработку персональных данных', href: '/legal/soglasie' },
  { title: 'Согласие на рассылку', href: '/legal/marketing-consent' },
  { title: 'Условия подписки', href: '/legal/subscription' },
  { title: 'Правила AI-помощника', href: '/legal/ai-rules' },
  { title: 'Оплата и возврат', href: '/legal/vozvrat' },
  { title: 'Для авторов', href: '/legal/avtory' },
];

export const metadata: Metadata = {
  title: 'Юридические документы — Методический кабинет педагога',
  description: 'Оферта, политика обработки персональных данных, пользовательское соглашение и условия возврата.',
  alternates: { canonical: '/legal' },
};

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
          ← На главную
        </Link>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Документы
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Юридическая информация
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Здесь собраны документы проекта «Дошкольное на лаконичном».
          </p>

          <div className="mt-8 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {documents.map((document) => (
              <Link
                key={document.href}
                href={document.href}
                className="flex items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 hover:text-blue-600"
              >
                <span>{document.title}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
