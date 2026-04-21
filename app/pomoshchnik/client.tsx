'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bot, Loader2, Lock, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthSession } from '../../src/hooks/useAuthSession';

interface AiSummary {
  available: boolean;
  reason: 'active' | 'no_subscription' | 'not_configured';
  monthlyLimit: number;
  usedThisMonth: number;
  remainingThisMonth: number;
  subscriptionActive: boolean;
  configured: boolean;
}

interface AccountSummaryResponse {
  ai?: AiSummary;
}

function helperMessage(summary: AiSummary | null): string {
  if (!summary) return '';
  if (!summary.subscriptionActive) {
    return 'AI-помощник входит в подписку. После подключения откроются ответы по документам, планированию и практическим ситуациям.';
  }
  if (!summary.configured) {
    return 'AI-помощник уже подключён в интерфейсе, но серверный ключ OpenAI ещё не добавлен.';
  }
  if (summary.remainingThisMonth <= 0) {
    return 'Лимит AI-запросов на этот месяц уже исчерпан. Новый пакет откроется с началом следующего месяца.';
  }
  return 'Пишите вопрос как можно конкретнее: ситуация, возраст детей, цель и что именно нужно получить на выходе.';
}

export function PomoshchnikClient() {
  const { user, isAuthenticated, loading } = useAuthSession();
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    setSummaryLoading(true);

    fetch('/api/account/summary', {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: AccountSummaryResponse) => {
        setSummary(data.ai ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSummary(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      });

    return () => controller.abort();
  }, [isAuthenticated]);

  const canUseAssistant = useMemo(() => {
    return Boolean(summary?.available);
  }, [summary]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUseAssistant || requestLoading) return;

    setRequestLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/assistant/respond', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ??
            'Не удалось получить ответ помощника. Попробуйте ещё раз чуть позже.'
        );
        return;
      }

      setAnswer(typeof data.answer === 'string' ? data.answer : '');
      if (data.usage) {
        setSummary(data.usage as AiSummary);
      }
      setMessage('');
    } catch {
      setError('Не удалось получить ответ помощника. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setRequestLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Вход по аккаунту
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">AI-помощник открыт только для авторизованных пользователей</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Войдите в аккаунт, чтобы использовать помощника, сохранять историю запросов и видеть лимит по подписке.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/vhod"
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Войти
              </Link>
              <Link
                href="/registratsiya"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-300"
              >
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                AI-помощник по подписке
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Помощник для документов, планов и рабочих вопросов</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Помогает собрать черновик документа, структуру занятия, ответ родителям или план действий по ситуации в группе.
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Лимит запросов
              </div>
              {summaryLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загружаем статус
                </div>
              ) : summary ? (
                <>
                  <p className="mt-3 text-2xl font-bold text-gray-900">
                    {summary.remainingThisMonth} / {summary.monthlyLimit}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Осталось в этом месяце. Использовано: {summary.usedThisMonth}.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Статус пока не загрузился.</p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium text-gray-900">Как помощник отвечает</p>
                <p className="mt-1">
                  {helperMessage(summary)}
                </p>
              </div>
            </div>
          </div>

          {!summaryLoading && summary && !summary.subscriptionActive && (
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Нужна активная подписка</p>
                  <p className="mt-1 text-sm text-amber-800">
                    В подписке уже включены 15 AI-запросов в месяц и скидка 25% на магазин материалов.
                  </p>
                  <Link
                    href="/podpiska"
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    Открыть подписку
                  </Link>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-900">
                Ваш вопрос
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Например: помоги составить спокойный ответ родителям по ситуации конфликта детей в старшей группе и предложи структуру беседы."
                rows={8}
                disabled={!canUseAssistant || requestLoading}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-500">
                Ответы помощника стоит проверять перед публикацией и использованием в официальных документах.
              </div>
              <button
                type="submit"
                disabled={!canUseAssistant || requestLoading || message.trim().length < 10}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {requestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {requestLoading ? 'Готовим ответ...' : 'Получить ответ'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {answer && (
            <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Bot className="h-4 w-4" />
                Ответ помощника
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-800">
                {answer}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              'структура документа или ответа',
              'черновик плана занятия',
              'спокойный текст для родителей',
            ].map((tip) => (
              <button
                key={tip}
                type="button"
                onClick={() => setMessage(`Помоги подготовить ${tip} по теме: `)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                {tip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
