'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { HelpCircle, Loader2, MessageSquareMore, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthSession } from '../../src/hooks/useAuthSession';

type QuestionFormState = {
  name: string;
  age: string;
  city: string;
  email: string;
  position: string;
  groupAge: string;
  program: string;
  topic: string;
  question: string;
  vkLink: string;
  telegramLink: string;
  consent: boolean;
};

const GROUP_AGE_OPTIONS = [
  { value: '', label: 'Выберите возраст группы' },
  { value: '1–2 года', label: '1–2 года' },
  { value: '2–3 года', label: '2–3 года' },
  { value: '3–4 года', label: '3–4 года' },
  { value: '4–5 лет', label: '4–5 лет' },
  { value: '5–6 лет', label: '5–6 лет' },
  { value: '6–7 лет', label: '6–7 лет' },
  { value: 'разновозрастная группа', label: 'Разновозрастная группа' },
];

const PROGRAM_OPTIONS = [
  { value: '', label: 'Выберите программу' },
  { value: 'ФОП ДО', label: 'ФОП ДО' },
  { value: 'ФАОП ДО', label: 'ФАОП ДО' },
  { value: 'ФАОП ДО / ТНР', label: 'ФАОП ДО / ТНР' },
  { value: 'АООП / своя программа', label: 'АООП / своя программа' },
];

const TIPS = [
  'Опишите конкретную ситуацию: что уже произошло и в чём именно нужна помощь.',
  'Добавьте возраст группы, программу и роль, чтобы эксперт не гадал на контексте.',
  'Если нужен ответ по документам, напишите, какой именно документ вы сейчас готовите.',
];

const EXAMPLES = [
  'Как правильно оформить КТП на месяц для средней группы по ФОП ДО?',
  'Что делать, если ребёнок тяжело проходит повторную адаптацию после длительного перерыва?',
  'Как выстроить работу с родителями, если в группе постоянные конфликты по режиму дня?',
];

export function MolodoySpecialistClient() {
  const { user, isAuthenticated, loading } = useAuthSession();
  const [form, setForm] = useState<QuestionFormState>({
    name: '',
    age: '',
    city: '',
    email: '',
    position: '',
    groupAge: '',
    program: '',
    topic: '',
    question: '',
    vkLink: '',
    telegramLink: '',
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string; ticketId: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const effectiveEmail = useMemo(
    () => (isAuthenticated && user?.email ? user.email : form.email),
    [form.email, isAuthenticated, user?.email]
  );

  function updateField<K extends keyof QuestionFormState>(key: K, value: QuestionFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setErrorMessage('');

    try {
      const response = await fetch('/api/young-specialist/questions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          age: form.age,
          city: form.city,
          email: effectiveEmail,
          position: form.position,
          groupAge: form.groupAge,
          program: form.program,
          topic: form.topic,
          question: form.question,
          vkLink: form.vkLink,
          telegramLink: form.telegramLink,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Не удалось отправить вопрос. Попробуйте ещё раз.');
      }

      setSuccess({
        message:
          data?.message ||
          'Вопрос принят. Мы сохранили его в системе и передадим эксперту.',
        ticketId: data?.question?.ticketId || '',
      });
      setForm((prev) => ({
        ...prev,
        name: '',
        age: '',
        city: '',
        position: '',
        groupAge: '',
        program: '',
        topic: '',
        question: '',
        vkLink: '',
        telegramLink: '',
        consent: false,
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Не удалось отправить вопрос. Попробуйте ещё раз.'
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
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Молодой специалист</h1>
            <p className="mt-2 text-sm text-gray-500">
              Если застряли на рабочем вопросе, опишите ситуацию. Мы сохраним обращение, присвоим
              номер и передадим его эксперту.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-teal-500" />
            <p>
              Это живая форма обращения, а не витрина. После отправки вопрос сразу попадает в базу и
              открывается для обработки в админке.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Имя</span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="Например: Анна"
                    autoComplete="given-name"
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
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Возраст</span>
                  <input
                    type="number"
                    min="18"
                    max="90"
                    value={form.age}
                    onChange={(event) => updateField('age', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="24"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Город</span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="Например: Екатеринбург"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Должность</span>
                  <input
                    type="text"
                    required
                    value={form.position}
                    onChange={(event) => updateField('position', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="Например: воспитатель"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Возраст группы</span>
                  <select
                    value={form.groupAge}
                    onChange={(event) => updateField('groupAge', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                  >
                    {GROUP_AGE_OPTIONS.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Программа</span>
                  <select
                    value={form.program}
                    onChange={(event) => updateField('program', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                  >
                    {PROGRAM_OPTIONS.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Тема вопроса</span>
                  <input
                    type="text"
                    required
                    value={form.topic}
                    onChange={(event) => updateField('topic', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="Кратко обозначьте тему"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Ваш вопрос</span>
                <textarea
                  required
                  rows={8}
                  value={form.question}
                  onChange={(event) => updateField('question', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                  placeholder="Опишите ситуацию подробно: что произошло, что уже пробовали и в чём нужна помощь."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Ссылка на VK (необязательно)</span>
                  <input
                    type="url"
                    value={form.vkLink}
                    onChange={(event) => updateField('vkLink', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="https://vk.com/..."
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Ссылка на Telegram (необязательно)</span>
                  <input
                    type="url"
                    value={form.telegramLink}
                    onChange={(event) => updateField('telegramLink', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400"
                    placeholder="https://t.me/..."
                  />
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => updateField('consent', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                />
                <span>
                  Я согласен на обработку персональных данных и понимаю, что вопрос будет сохранён в
                  системе. При необходимости можно сослаться на{' '}
                  <Link href="/legal/soglasie" className="font-medium text-teal-600 underline underline-offset-2">
                    согласие
                  </Link>{' '}
                  и{' '}
                  <Link href="/legal/konfidentsialnost" className="font-medium text-teal-600 underline underline-offset-2">
                    политику конфиденциальности
                  </Link>
                  .
                </span>
              </label>

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <p>{success.message}</p>
                  {success.ticketId && <p className="mt-1 font-semibold">Номер обращения: {success.ticketId}</p>}
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
                  disabled={submitting || loading || !form.consent}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareMore className="h-4 w-4" />}
                  {submitting ? 'Отправляем вопрос...' : 'Отправить вопрос'}
                </button>
                <Link
                  href="/materialy"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                >
                  Посмотреть материалы
                </Link>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">Что поможет получить точный ответ</h2>
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
              <h2 className="text-base font-semibold text-gray-900">Примеры тем</h2>
              <ul className="mt-3 space-y-3 text-sm text-gray-600">
                {EXAMPLES.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
