'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, Shield, Users } from 'lucide-react';

interface UsersSummary {
  totalUsers: number;
  adminUsers: number;
  verifiedUsers: number;
  activeSubscriptions: number;
}

interface UserItem {
  id: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  profile: {
    name: string;
    lastName: string;
    role: string;
    city: string;
    institution: string;
  };
  materialsCount: number;
  ordersCount: number;
  paidTotalRubles: number;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
  };
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  none: 'Без подписки',
  active: 'Подписка активна',
  cancelled: 'Подписка отменена',
  expired: 'Подписка истекла',
  paused: 'Подписка на паузе',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function UsersManager() {
  const [summary, setSummary] = useState<UsersSummary | null>(null);
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');

  function loadData(signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filter) params.set('filter', filter);

    setLoading(true);
    setError('');

    return fetch(`/api/admin/users?${params.toString()}`, {
      credentials: 'include',
      signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setSummary(data?.summary ?? null);
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!signal?.aborted) {
          setError('Не удалось загрузить пользователей. Обновите страницу.');
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
  }, [search, filter]);

  async function resetSessions(userId: string) {
    setActionLoadingId(userId);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_sessions' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(data.error ?? 'Не удалось завершить сессии пользователя.');
        return;
      }

      setActionSuccess(data.message ?? 'Все старые сессии пользователя завершены.');
    } catch {
      setActionError('Не удалось завершить сессии пользователя. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setActionLoadingId('');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Пользователи</h1>
        <p className="text-sm text-gray-500">
          Живой список аккаунтов, подписок, заказов и быстрый безопасный сброс всех старых сессий.
        </p>
      </div>

      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Всего пользователей</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalUsers}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Администраторы</p>
            <p className="text-2xl font-bold text-gray-900">{summary.adminUsers}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Подтвердили email</p>
            <p className="text-2xl font-bold text-gray-900">{summary.verifiedUsers}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Активные подписки</p>
            <p className="text-2xl font-bold text-gray-900">{summary.activeSubscriptions}</p>
          </div>
        </section>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email, имени, городу или учреждению"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все пользователи</option>
          <option value="admins">Только админы</option>
          <option value="unverified">Не подтвердили email</option>
          <option value="subscription">С активной подпиской</option>
        </select>
      </div>

      {(error || actionError || actionSuccess) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm border ${
            actionSuccess
              ? 'bg-green-50 border-green-100 text-green-700'
              : 'bg-red-50 border-red-100 text-red-700'
          }`}
        >
          {actionSuccess || actionError || error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center px-4">
            <Users className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Пользователи не найдены</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const fullName = [item.profile.lastName, item.profile.name].filter(Boolean).join(' ');

              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 break-all">
                        {fullName || item.email}
                      </p>
                      <p className="text-xs text-gray-500 break-all">{item.email}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Регистрация: {formatDate(item.createdAt)}</p>
                      {item.subscription.currentPeriodEnd && (
                        <p>До: {formatDate(item.subscription.currentPeriodEnd)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.isAdmin && (
                      <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium inline-flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        admin
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full font-medium ${item.emailVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {item.emailVerified ? 'Email подтверждён' : 'Email не подтверждён'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {SUBSCRIPTION_LABELS[item.subscription.status] ?? item.subscription.status}
                    </span>
                    {item.profile.role && (
                      <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                        {item.profile.role}
                      </span>
                    )}
                    {item.profile.city && (
                      <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                        {item.profile.city}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500 mb-1">Материалы</p>
                      <p className="text-lg font-semibold text-gray-900">{item.materialsCount}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500 mb-1">Заказы</p>
                      <p className="text-lg font-semibold text-gray-900">{item.ordersCount}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500 mb-1">Оплачено</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {item.paidTotalRubles.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>

                  {item.profile.institution && (
                    <p className="text-xs text-gray-500">
                      Учреждение: {item.profile.institution}
                    </p>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() => resetSessions(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-gray-300 disabled:opacity-50"
                    >
                      {actionLoadingId === item.id ? 'Сбрасываем сессии...' : 'Завершить все старые сессии'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
