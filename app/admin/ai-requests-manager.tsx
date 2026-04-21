'use client';

import { useEffect, useState } from 'react';
import { Bot, Loader2, Search, Sparkles } from 'lucide-react';

interface AiRequestSummary {
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  totalTokens: number;
}

interface AiRequestItem {
  id: string;
  userEmail: string;
  status: string;
  model: string;
  prompt: string;
  response: string | null;
  tokensUsed: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  completed: 'Готово',
  failed: 'Ошибка',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AiRequestsManager() {
  const [summary, setSummary] = useState<AiRequestSummary | null>(null);
  const [items, setItems] = useState<AiRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);

    setLoading(true);
    setError('');

    fetch(`/api/admin/ai-requests?${params.toString()}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setSummary(data?.summary ?? null);
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('Не удалось загрузить AI-запросы. Обновите страницу.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [search, status]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI-запросы</h1>
        <p className="text-sm text-gray-500">
          История обращений к AI-помощнику, статусы, ошибки и общая нагрузка по использованию.
        </p>
      </div>

      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Готово</p>
            <p className="text-2xl font-bold text-gray-900">{summary.completedCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Ожидают</p>
            <p className="text-2xl font-bold text-gray-900">{summary.pendingCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Ошибки</p>
            <p className="text-2xl font-bold text-gray-900">{summary.failedCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Токены</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalTokens.toLocaleString('ru-RU')}</p>
          </div>
        </section>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email, вопросу или ответу"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидают</option>
          <option value="completed">Готово</option>
          <option value="failed">Ошибка</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center px-4">
            <Sparkles className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">AI-запросов пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 break-all">{item.userEmail}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(item.createdAt)} · model {item.model}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    {item.tokensUsed !== null && (
                      <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                        {item.tokensUsed.toLocaleString('ru-RU')} токенов
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Bot className="h-3.5 w-3.5" />
                    Запрос
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">{item.prompt}</p>
                </div>

                {item.response && (
                  <div className="rounded-2xl bg-emerald-50/70 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Ответ
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">{item.response}</p>
                  </div>
                )}

                {item.error && (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
