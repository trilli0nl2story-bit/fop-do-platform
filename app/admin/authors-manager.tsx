'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, TrendingUp, UserCheck } from 'lucide-react';

interface AuthorsSummary {
  totalAuthors: number;
  linkedAccounts: number;
  verifiedAccounts: number;
  selfEmployedCount: number;
  ipCount: number;
}

interface AuthorItem {
  id: string;
  userId: string | null;
  accountEmail: string | null;
  accountEmailVerified: boolean;
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: string;
  position: string;
  bio: string;
  employmentType: string;
  documentUrl: string;
  createdAt: string;
  approvedAt: string;
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  self_employed: 'Самозанятый',
  individual_entrepreneur: 'ИП',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AuthorsManager() {
  const [summary, setSummary] = useState<AuthorsSummary | null>(null);
  const [items, setItems] = useState<AuthorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (employmentType) params.set('employmentType', employmentType);

    setLoading(true);
    setError('');

    fetch(`/api/admin/authors?${params.toString()}`, {
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
          setError('Не удалось загрузить список авторов. Обновите страницу.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [search, employmentType]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Авторы</h1>
        <p className="text-sm text-gray-500">
          Уже одобренные авторы платформы: контакты, статусы аккаунтов и краткая рабочая информация по каждому.
        </p>
      </div>

      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Всего авторов</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalAuthors}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Связаны с аккаунтом</p>
            <p className="text-2xl font-bold text-gray-900">{summary.linkedAccounts}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Подтвердили email</p>
            <p className="text-2xl font-bold text-gray-900">{summary.verifiedAccounts}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Самозанятые</p>
            <p className="text-2xl font-bold text-gray-900">{summary.selfEmployedCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">ИП</p>
            <p className="text-2xl font-bold text-gray-900">{summary.ipCount}</p>
          </div>
        </section>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по имени, email, городу или роли"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={employmentType}
          onChange={(event) => setEmploymentType(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все формы занятости</option>
          <option value="self_employed">Самозанятые</option>
          <option value="individual_entrepreneur">ИП</option>
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
            <TrendingUp className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Одобренных авторов пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 break-all">{item.email}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Одобрен: {formatDate(item.approvedAt)}</p>
                    <p>Заявка: {formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {EMPLOYMENT_LABELS[item.employmentType] ?? item.employmentType}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                    {item.position}
                  </span>
                  {item.city && (
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                      {item.city}
                    </span>
                  )}
                  {item.accountEmail && (
                    <span className={`px-2 py-1 rounded-full font-medium ${item.accountEmailVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      Аккаунт: {item.accountEmailVerified ? 'email подтверждён' : 'email не подтверждён'}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Опыт</p>
                    <p className="mt-2 text-sm leading-6 text-gray-800 whitespace-pre-wrap">
                      {item.experience || 'Не указан'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">О себе и материалах</p>
                    <p className="mt-2 text-sm leading-6 text-gray-800 whitespace-pre-wrap">
                      {item.bio}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {item.phone && <span>Телефон: {item.phone}</span>}
                  {item.accountEmail && (
                    <span className="inline-flex items-center gap-1">
                      <UserCheck className="w-4 h-4 text-blue-500" />
                      Аккаунт: {item.accountEmail}
                    </span>
                  )}
                  {item.documentUrl && (
                    <a
                      href={item.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Открыть документы автора
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
