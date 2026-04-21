import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Помощник — Методический кабинет педагога',
  description:
    'Раздел помощника сейчас развивается. Пока можно воспользоваться готовыми материалами и живой заявкой на документ.',
  robots: { index: false, follow: false },
};

export default function PomoshchnikPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Раздел развивается
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Помощник скоро станет отдельным рабочим разделом</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Мы не хотим показывать пустую имитацию помощника. Пока вместо этого доступны два
            честных сценария: выбрать готовые материалы или оставить живую заявку на нужный документ.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/materialy"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Открыть материалы
            </Link>
            <Link
              href="/zakazat-dokument"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-300"
            >
              Заказать документ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
