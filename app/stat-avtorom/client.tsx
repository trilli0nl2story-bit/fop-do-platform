'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2, FileBadge2, Loader2, PenLine, ShieldCheck, Upload } from 'lucide-react';
import { useAuthSession } from '../../src/hooks/useAuthSession';

type AuthorFormState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: string;
  position: string;
  bio: string;
  employmentType: string;
  sampleUrl: string;
};

const EMPLOYMENT_OPTIONS = [
  { value: '', label: 'Выберите статус занятости' },
  { value: 'self_employed', label: 'Самозанятый' },
  { value: 'individual_entrepreneur', label: 'ИП' },
];

const REQUIREMENTS = [
  'Педагогический опыт или сильная практическая экспертиза в дошкольном образовании.',
  'Авторские материалы без нарушений чужих прав.',
  'Готовность работать в рамках требований платформы и редакционной проверки.',
];

export function StatAvtoromClient() {
  const { user, isAuthenticated, loading } = useAuthSession();
  const [form, setForm] = useState<AuthorFormState>({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: '',
    position: '',
    bio: '',
    employmentType: '',
    sampleUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const effectiveEmail = useMemo(
    () => (isAuthenticated && user?.email ? user.email : form.email),
    [form.email, isAuthenticated, user?.email]
  );

  function updateField<K extends keyof AuthorFormState>(key: K, value: AuthorFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/author-applications', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: effectiveEmail,
          phone: form.phone,
          city: form.city,
          experience: form.experience,
          position: form.position,
          bio: form.bio,
          employmentType: form.employmentType,
          sampleUrl: form.sampleUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Не удалось отправить заявку автора. Попробуйте ещё раз.');
      }

      setSuccessMessage(data?.message || 'Заявка автора принята.');
      setForm({
        name: '',
        email: '',
        phone: '',
        city: '',
        experience: '',
        position: '',
        bio: '',
        employmentType: '',
        sampleUrl: '',
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Не удалось отправить заявку автора. Попробуйте ещё раз.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
            <PenLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Стать автором</h1>
            <p className="mt-2 text-sm text-gray-500">
              Оставьте заявку, если хотите публиковать свои материалы на платформе. Мы не обещаем
              лишнего на этой странице — сначала получаем заявку, потом возвращаемся с решением.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
            <p>
              Это живая заявка в базу. После отправки она фиксируется сразу, а не остаётся просто
              формой “для вида”.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Имя и фамилия</span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                    placeholder="Например: Мария Иванова"
                    autoComplete="name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Email</span>
                  <input
                    type="email"
                    required
                    value={effectiveEmail}
                    onChange={(event) => updateField('email', event.target.value)}
                    disabled={Boolean(isAuthenticated && user?.email)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Телефон</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                    placeholder="+7 (___) ___-__-__"
                    autoComplete="tel"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Город</span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                    placeholder="Например: Казань"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Опыт</span>
                  <input
                    type="text"
                    value={form.experience}
                    onChange={(event) => updateField('experience', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                    placeholder="Например: 9 лет в ДОУ"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Должность</span>
                  <input
                    type="text"
                    required
                    value={form.position}
                    onChange={(event) => updateField('position', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                    placeholder="Например: воспитатель"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Статус занятости</span>
                <select
                  required
                  value={form.employmentType}
                  onChange={(event) => updateField('employmentType', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                >
                  {EMPLOYMENT_OPTIONS.map((option) => (
                    <option key={option.value || 'empty'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">О себе и о материалах</span>
                <textarea
                  required
                  rows={7}
                  value={form.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                  placeholder="Расскажите, какие материалы вы создаёте, в чём ваша сильная сторона и почему хотите публиковаться на платформе."
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Ссылка на пример материала</span>
                <div className="relative">
                  <Upload className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={form.sampleUrl}
                    onChange={(event) => updateField('sampleUrl', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-green-400"
                    placeholder="https://... или ссылка на ваш файл"
                  />
                </div>
              </label>

              {successMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  {successMessage}
                  <div className="mt-2">
                    <Link href="/kabinet" className="font-medium underline underline-offset-2">
                      Вернуться в кабинет
                    </Link>
                  </div>
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBadge2 className="h-4 w-4" />}
                  {submitting ? 'Отправляем заявку...' : 'Отправить заявку'}
                </button>
                <Link
                  href="/kabinet"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                >
                  Вернуться в кабинет
                </Link>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Что мы смотрим в заявке</h2>
              <ul className="mt-3 space-y-3 text-sm text-gray-700">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Как дальше идёт процесс</h2>
              <ol className="mt-3 space-y-3 text-sm text-gray-600">
                <li>1. Вы оставляете заявку и пример материала.</li>
                <li>2. Мы смотрим качество, тему и формат работы.</li>
                <li>3. Потом возвращаемся с ответом и условиями подключения.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
