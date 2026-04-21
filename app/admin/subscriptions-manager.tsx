'use client';

import { useEffect, useState } from 'react';
import { Crown, Loader2, Search } from 'lucide-react';

interface AdminSubscriptionItem {
  id: string;
  status: string;
  provider: string;
  planCode: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  cancelled: 'Отменена',
  expired: 'Истекла',
  paused: 'Приостановлена',
};

const PLAN_LABELS: Record<string, string> = {
  monthly: '1 месяц',
  quarterly: '3 месяца',
  semiannual: '6 месяцев',
  annual: '12 месяцев',
};

export function SubscriptionsManager() {
  const [items, setItems] = useState<AdminSubscriptionItem[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [actionError, setActionError] = useState('');

  function loadData(signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search.trim()) params.set('search', search.trim());

    setLoading(true);
    setError('');

    return fetch(`/api/admin/subscriptions?${params.toString()}`, {
      credentials: 'include',
      signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {
        if (!signal?.aborted) {
          setError('Не удалось загрузить подписки. Обновите страницу.');
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [status, search]);

  async function handleAction(
    subscriptionId: string,
    action: 'pause' | 'resume' | 'cancel' | 'expire' | 'extend'
  ) {
    setActionLoadingId(subscriptionId + action);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          months: action === 'extend' ? 1 : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error ?? 'Не удалось обновить подписку.');
        return;
      }

      await loadData();
    } catch {
      setActionError('Не удалось обновить подписку. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setActionLoadingId('');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Подписки</h1>
        <p className="text-sm text-gray-500">
          Активные и завершённые подписки с реальными датами периода и быстрыми действиями.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="cancelled">Отменённые</option>
          <option value="expired">Истекшие</option>
          <option value="paused">Приостановленные</option>
        </select>
      </div>

      {(error || actionError) && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error || actionError}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center px-4">
            <Crown className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Подписок пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 break-all">{item.userEmail}</p>
                    <p className="text-xs text-gray-500 break-all">{item.id}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{PLAN_LABELS[item.planCode] ?? item.planCode}</p>
                    <p>{item.provider}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                    До {formatDate(item.currentPeriodEnd)}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                    Старт {formatDate(item.currentPeriodStart)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, 'pause')}
                      disabled={Boolean(actionLoadingId)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-gray-300 disabled:opacity-50"
                    >
                      {actionLoadingId === item.id + 'pause' ? 'Пауза...' : 'Пауза'}
                    </button>
                  )}

                  {item.status === 'paused' && (
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, 'resume')}
                      disabled={Boolean(actionLoadingId)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-gray-300 disabled:opacity-50"
                    >
                      {actionLoadingId === item.id + 'resume' ? 'Возобновляем...' : 'Возобновить'}
                    </button>
                  )}

                  {item.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, 'cancel')}
                      disabled={Boolean(actionLoadingId)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:border-red-300 disabled:opacity-50"
                    >
                      {actionLoadingId === item.id + 'cancel' ? 'Отменяем...' : 'Отменить'}
                    </button>
                  )}

                  {item.status !== 'expired' && (
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, 'expire')}
                      disabled={Boolean(actionLoadingId)}
                      className="px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-medium text-amber-700 hover:border-amber-300 disabled:opacity-50"
                    >
                      {actionLoadingId === item.id + 'expire' ? 'Закрываем...' : 'Завершить сейчас'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAction(item.id, 'extend')}
                    disabled={Boolean(actionLoadingId)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {actionLoadingId === item.id + 'extend' ? 'Продлеваем...' : '+1 месяц'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
