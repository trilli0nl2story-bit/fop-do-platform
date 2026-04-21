'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FileText, Lightbulb, Loader2, Package, ShieldCheck } from 'lucide-react';
import { useAuthSession } from '../../src/hooks/useAuthSession';

type RequestState = {
  email: string;
  name: string;
  topic: string;
  ageGroup: string;
  documentType: string;
  description: string;
};

const AGE_GROUP_OPTIONS = [
  { value: '', label: 'Выберите возрастную группу' },
  { value: '1-2', label: '1–2 года' },
  { value: '2-3', label: '2–3 года' },
  { value: '3-4', label: '3–4 года' },
  { value: '4-5', label: '4–5 лет' },
  { value: '5-6', label: '5–6 лет' },
  { value: '6-7', label: '6–7 лет' },
  { value: 'pedagogues', label: 'Для педагогов' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: '', label: 'Выберите тип документа' },
  { value: 'lesson-plan', label: 'Конспект занятия' },
  { value: 'program', label: 'Рабочая программа' },
  { value: 'project', label: 'Проект' },
  { value: 'diagnostic', label: 'Диагностика' },
  { value: 'methodical', label: 'Методический материал' },
  { value: 'other', label: 'Другое' },
];

const TIPS = [
  'Опишите тему простыми словами: что это за материал и для кого он нужен.',
  'Укажите, если важны ФОП ДО, ФАОП ДО, конкретная структура или формат файла.',
  'Если вы уже зарегистрированы, заявка автоматически появится в кабинете.',
];

export function ZakazatDokumentClient() {
  const { user, isAuthenticated, loading } = useAuthSession();
  const [form, setForm] = useState<RequestState>({
    email: '',
    name: '',
    topic: '',
    ageGroup: '',
    documentType: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const effectiveEmail = useMemo(
    () => (isAuthenticated && user?.email ? user.email : form.email),
    [form.email, isAuthenticated, user?.email]
  );

  function updateField<K extends keyof RequestState>(key: K, value: RequestState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/document-requests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: effectiveEmail,
          name: form.name,
          topic: form.topic,
          ageGroup: form.ageGroup,
          documentType: form.documentType,
          description: form.description,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Не удалось отправить заявку. Попробуйте ещё раз.');
      }

      setSuccessMessage(
        data?.message ||
          (isAuthenticated
            ? 'Заявка принята. Она появится в вашем кабинете.'
            : 'Заявка принята. Мы свяжемся с вами по указанному email.')
      );
      setForm((prev) => ({
        ...prev,
        name: '',
        topic: '',
        ageGroup: '',
        documentType: '',
        description: '',
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Не удалось отправить заявку. Попробуйте ещё раз.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Заказать документ</h1>
            <p className="mt-2 text-sm text-gray-500">
              Опишите, какой материал нужен. Заявка сохранится в системе, а если вы вошли в аккаунт,
              её статус появится в кабинете.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-teal-500" />
            <p>
              Это живая заявка, не декоративная форма. Мы сохраняем её в базе сразу после отправки.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Email для связи</span>
                  <input
                    type="email"
                    required
                    value={effectiveEmail}
                    onChange={(event) => updateField('email', event.target.value)}
                    disabled={Boolean(isAuthenticated && user?.email)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Как к вам обращаться</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="Например: Анна"
                    autoComplete="name"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Тема материала</span>
                <input
                  type="text"
                  required
                  value={form.topic}
                  onChange={(event) => updateField('topic', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                  placeholder="Например: занятие по экологии «Весенний лес»"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Возрастная группа</span>
                  <select
                    value={form.ageGroup}
                    onChange={(event) => updateField('ageGroup', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                  >
                    {AGE_GROUP_OPTIONS.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Тип документа</span>
                  <select
                    value={form.documentType}
                    onChange={(event) => updateField('documentType', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                  >
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Что важно учесть</span>
                <textarea
                  required
                  rows={8}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                  placeholder="Опишите структуру, цели, пожелания по оформлению, что обязательно включить, и любые детали, которые помогут подготовить материал точнее."
                />
              </label>

              {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  {successMessage}
                  {isAuthenticated && (
                    <div className="mt-2">
                      <Link href="/kabinet" className="font-medium underline underline-offset-2">
                        Открыть кабинет
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {submitting ? 'Отправляем заявку...' : 'Отправить заявку'}
                </button>
                <Link
                  href={isAuthenticated ? '/kabinet' : '/materialy'}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                >
                  {isAuthenticated ? 'Вернуться в кабинет' : 'Посмотреть материалы'}
                </Link>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">Что поможет получить точный результат</h2>
              </div>
              <ul className="space-y-3 text-sm text-gray-700">
                {TIPS.map((tip) => (
                  <li key={tip} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Что происходит после отправки</h2>
              <ol className="mt-3 space-y-3 text-sm text-gray-600">
                <li>1. Заявка сохраняется сразу, без ручного переноса.</li>
                <li>2. Если вы вошли в аккаунт, её видно в кабинете.</li>
                <li>3. Дальше мы берём заявку в работу и обновляем статус.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
