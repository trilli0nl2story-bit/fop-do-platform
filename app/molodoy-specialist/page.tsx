import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Молодой специалист — Методический кабинет педагога',
  description:
    'Раздел для молодого специалиста готовится. Пока можно использовать базу материалов и оформить заявку на нужный документ.',
  robots: { index: false, follow: false },
};

export default function MolodoySpecialistPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            Готовим рабочий запуск
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Раздел для молодого специалиста ещё в сборке</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Мы выводим сюда только то, что уже реально работает. Пока экспертная линия и личные
            ответы ещё не доведены до конца, лучше не обещать лишнего. Уже сейчас можно выбрать
            готовые материалы или оставить заявку на нужный документ.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/materialy"
              className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-600"
            >
              Посмотреть материалы
            </Link>
            <Link
              href="/zakazat-dokument"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-300"
            >
              Оставить заявку
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
