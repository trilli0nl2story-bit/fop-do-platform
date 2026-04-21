'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Search, UserCheck } from 'lucide-react';

type AuthorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'revision';

interface AuthorApplicationItem {
  id: string;
  userId: string | null;
  accountEmail: string | null;
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: string;
  position: string;
  bio: string;
  status: AuthorApplicationStatus;
  employmentType: string;
  documentUrl: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS: Array<{ value: AuthorApplicationStatus; label: string }> = [
  { value: 'pending', label: 'Новая' },
  { value: 'approved', label: 'Одобрена' },
  { value: 'rejected', label: 'Отклонена' },
  { value: 'revision', label: 'Нужна доработка' },
];

const EMPLOYMENT_LABELS: Record<string, string> = {
  self_employed: 'Самозанятый',
  individual_entrepreneur: 'ИП',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuthorApplicationsManager() {
  const [items, setItems] = useState<AuthorApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { status: AuthorApplicationStatus; adminNote: string; documentUrl: string }>>({});
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [savingId, setSavingId] = useState('');

  function loadData(signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);

    setLoading(true);
    setError('');

    return fetch(`/api/admin/author-applications?${params.toString()}`, {
      credentials: 'include',
      signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        setItems(nextItems);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const item of nextItems) {
            next[item.id] = next[item.id] ?? {
              status: item.status,
              adminNote: item.adminNote,
              documentUrl: item.documentUrl,
            };
          }
          return next;
        });
      })
      .catch(() => {
        if (!signal?.aborted) {
          setError('Не удалось загрузить авторские заявки. Обновите страницу.');
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
  }, [search, status]);

  const counts = useMemo(() => {
    return items.reduce<Record<AuthorApplicationStatus, number>>(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
        revision: 0,
      }
    );
  }, [items]);

  function updateDraft(id: string, patch: Partial<{ status: AuthorApplicationStatus; adminNote: string; documentUrl: string }>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        status: patch.status ?? prev[id]?.status ?? 'pending',
        adminNote: patch.adminNote ?? prev[id]?.adminNote ?? '',
        documentUrl: patch.documentUrl ?? prev[id]?.documentUrl ?? '',
      },
    }));
  }

  async function saveItem(item: AuthorApplicationItem) {
    const draft = drafts[item.id];
    if (!draft) return;

    setSavingId(item.id);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await fetch(`/api/admin/author-applications/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error ?? 'Не удалось обновить заявку.');
        return;
      }

      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? {
                ...current,
                status: data.item.status,
                adminNote: data.item.adminNote,
                documentUrl: data.item.documentUrl,
                updatedAt: data.item.updatedAt,
              }
            : current
        )
      );
      setDrafts((prev) => ({
        ...prev,
        [item.id]: {
          status: data.item.status,
          adminNote: data.item.adminNote,
          documentUrl: data.item.documentUrl,
        },
      }));
      setSaveSuccess('Изменения сохранены.');
    } catch {
      setSaveError('Не удалось обновить заявку. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Авторские заявки</h1>
        <p className="text-sm text-gray-500">Здесь удобно проверять новых авторов, оставлять комментарии и отмечать тех, с кем уже можно двигаться дальше.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">{option.label}</p>
            <p className="text-2xl font-bold text-gray-900">{counts[option.value]}</p>
          </div>
        ))}
      </div>

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
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все статусы</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {(error || saveError || saveSuccess) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm border ${
            saveSuccess
              ? 'bg-green-50 border-green-100 text-green-700'
              : 'bg-red-50 border-red-100 text-red-700'
          }`}
        >
          {saveSuccess || saveError || error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center px-4">
            <UserCheck className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Авторских заявок пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const draft = drafts[item.id] ?? {
                status: item.status,
                adminNote: item.adminNote,
                documentUrl: item.documentUrl,
              };
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        <span>{item.email}</span>
                        {item.accountEmail && item.accountEmail !== item.email && <span>аккаунт: {item.accountEmail}</span>}
                        {item.city && <span>{item.city}</span>}
                        {item.position && <span>{item.position}</span>}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 lg:text-right">
                      <p>{formatDate(item.createdAt)}</p>
                      <p>{EMPLOYMENT_LABELS[item.employmentType] ?? item.employmentType}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {STATUS_OPTIONS.find((option) => option.value === item.status)?.label ?? item.status}
                    </span>
                    {item.phone && (
                      <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                        {item.phone}
                      </span>
                    )}
                    {item.updatedAt !== item.createdAt && (
                      <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                        обновлено {formatDate(item.updatedAt)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId((current) => (current === item.id ? '' : item.id))}
                    className="inline-flex text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {isExpanded ? 'Скрыть детали' : 'Открыть заявку'}
                  </button>

                  {isExpanded && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                      {item.experience && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Опыт</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.experience}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">О себе и материалах</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.bio}</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-gray-700">Статус</span>
                          <select
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(item.id, { status: event.target.value as AuthorApplicationStatus })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-gray-700">Ссылка на документы или примеры</span>
                          <input
                            value={draft.documentUrl}
                            onChange={(event) => updateDraft(item.id, { documentUrl: event.target.value })}
                            placeholder="https://... или /api/..."
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400"
                          />
                        </label>
                      </div>

                      <label className="block space-y-2 text-sm">
                        <span className="font-medium text-gray-700">Комментарий администратора</span>
                        <textarea
                          value={draft.adminNote}
                          onChange={(event) => updateDraft(item.id, { adminNote: event.target.value })}
                          rows={4}
                          placeholder="Что уже проверили, что нужно дослать, на каком этапе диалог"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 resize-y"
                        />
                      </label>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveItem(item)}
                          disabled={savingId === item.id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                        >
                          {savingId === item.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Сохраняем...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Сохранить
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
