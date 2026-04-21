'use client';

import { useEffect, useState } from 'react';
import { Crown, Loader2 } from 'lucide-react';

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

export function SubscriptionsManager() {
  const [items, setItems] = useState<AdminSubscriptionItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (status) params.set('status', status);

    setLoading(true);
    setError('');

    fetch(`/api/admin/subscriptions?${params.toString()}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('Не удалось загрузить подписки. Обновите страницу.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [status]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Подписки</h1>
        <p className="text-sm text-gray-500">Активные и завершённые подписки с реальными датами периода.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="cancelled">Отменённые</option>
          <option value="expired">Истёкшие</option>
          <option value="paused">Приостановленные</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
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
            <Crown className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Подписок пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 break-all">{item.userEmail}</p>
                    <p className="text-xs text-gray-500 break-all">{item.id}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{item.planCode}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
