'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileArchive, Loader2, Save, Search, ShieldCheck } from 'lucide-react';

type PrivacyRequestType = 'data_export' | 'account_deletion' | 'consent_withdrawal';
type PrivacyRequestStatus = 'new' | 'in_progress' | 'completed' | 'rejected';

interface PrivacyRequestsSummary {
  total: number;
  new: number;
  inProgress: number;
  completed: number;
  rejected: number;
}

interface PrivacyRequestItem {
  id: string;
  userId: string;
  email: string;
  name: string;
  lastName: string;
  role: string;
  city: string;
  requestType: PrivacyRequestType;
  status: PrivacyRequestStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  adminNote: string;
  metadata: Record<string, unknown>;
}

const STATUS_OPTIONS: Array<{ value: PrivacyRequestStatus; label: string }> = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Выполнен' },
  { value: 'rejected', label: 'Отклонён' },
];

const TYPE_OPTIONS: Array<{ value: PrivacyRequestType; label: string }> = [
  { value: 'data_export', label: 'Выгрузка данных' },
  { value: 'account_deletion', label: 'Удаление/обезличивание' },
  { value: 'consent_withdrawal', label: 'Отзыв согласия' },
];

const TYPE_LABELS: Record<PrivacyRequestType, string> = Object.fromEntries(
  TYPE_OPTIONS.map((option) => [option.value, option.label])
) as Record<PrivacyRequestType, string>;

const STATUS_LABELS: Record<PrivacyRequestStatus, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label])
) as Record<PrivacyRequestStatus, string>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function PrivacyRequestsManager() {
  const [summary, setSummary] = useState<PrivacyRequestsSummary | null>(null);
  const [items, setItems] = useState<PrivacyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { status: PrivacyRequestStatus; adminNote: string }>>({});
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const loadData = useCallback((signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (type) params.set('type', type);

    setLoading(true);
    setError('');

    return fetch(`/api/admin/privacy-requests?${params.toString()}`, {
      credentials: 'include',
      signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        setSummary(data?.summary ?? null);
        setItems(nextItems);
        setDrafts((previous) => {
          const next = { ...previous };
          for (const item of nextItems) {
            next[item.id] = next[item.id] ?? {
              status: item.status,
              adminNote: item.adminNote,
            };
          }
          return next;
        });
      })
      .catch(() => {
        if (!signal?.aborted) {
          setError('Не удалось загрузить обращения по персональным данным. Обновите страницу.');
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, [search, status, type]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const activeRequestsCount = useMemo(
    () => items.filter((item) => item.status === 'new' || item.status === 'in_progress').length,
    [items]
  );

  function updateDraft(id: string, patch: Partial<{ status: PrivacyRequestStatus; adminNote: string }>) {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        status: patch.status ?? previous[id]?.status ?? 'new',
        adminNote: patch.adminNote ?? previous[id]?.adminNote ?? '',
      },
    }));
  }

  async function saveItem(item: PrivacyRequestItem) {
    const draft = drafts[item.id];
    if (!draft) return;

    setSavingId(item.id);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await fetch(`/api/admin/privacy-requests/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSaveError(data.error ?? 'Не удалось обновить обращение.');
        return;
      }

      setItems((previous) =>
        previous.map((current) => (current.id === item.id ? data.item : current))
      );
      setDrafts((previous) => ({
        ...previous,
        [item.id]: {
          status: data.item.status,
          adminNote: data.item.adminNote,
        },
      }));
      setSaveSuccess('Обращение обновлено.');
      loadData();
    } catch {
      setSaveError('Не удалось обновить обращение. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Обращения по ПДн</h1>
        <p className="text-sm text-gray-500">
          Очередь запросов на выгрузку данных, удаление/обезличивание аккаунта и отзыв согласия. Здесь фиксируем ручную обработку, не удаляя данные автоматически.
        </p>
      </div>

      {summary && (
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatPill label="Всего" value={summary.total} />
          <StatPill label="Новые" value={summary.new} />
          <StatPill label="В работе" value={summary.inProgress} />
          <StatPill label="Выполнены" value={summary.completed} />
          <StatPill label="Отклонены" value={summary.rejected} />
        </section>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Активных обращений: {activeRequestsCount}</p>
            <p className="mt-1 text-blue-800">
              Перед статусом «Выполнен» проверьте вручную: что именно запросил пользователь, какие данные можно удалить, какие нужно сохранить из-за оплаты, налогового учёта и защиты прав.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col xl:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email, имени, городу или id обращения"
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
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все типы</option>
          {TYPE_OPTIONS.map((option) => (
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
            <FileArchive className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Обращений пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const draft = drafts[item.id] ?? {
                status: item.status,
                adminNote: item.adminNote,
              };
              const isExpanded = expandedId === item.id;
              const fullName = [item.lastName, item.name].filter(Boolean).join(' ');

              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {TYPE_LABELS[item.requestType] ?? item.requestType}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        <span className="break-all">{item.email}</span>
                        {fullName && <span>{fullName}</span>}
                        {item.role && <span>{item.role}</span>}
                        {item.city && <span>{item.city}</span>}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 lg:text-right">
                      <p>Создано: {formatDate(item.createdAt)}</p>
                      <p>Обновлено: {formatDate(item.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    {item.resolvedAt && (
                      <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                        закрыто {formatDate(item.resolvedAt)}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium break-all">
                      {item.id}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId((current) => (current === item.id ? '' : item.id))}
                    className="inline-flex text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {isExpanded ? 'Скрыть обработку' : 'Открыть обработку'}
                  </button>

                  {isExpanded && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <label className="space-y-2 text-sm">
                          <span className="font-medium text-gray-700">Статус</span>
                          <select
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(item.id, { status: event.target.value as PrivacyRequestStatus })
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

                        <div className="space-y-2 text-sm">
                          <span className="font-medium text-gray-700">Пользователь</span>
                          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-700">
                            <p className="break-all">{item.email}</p>
                            <p className="text-xs text-gray-500 break-all">{item.userId}</p>
                          </div>
                        </div>
                      </div>

                      <label className="block space-y-2 text-sm">
                        <span className="font-medium text-gray-700">Комментарий администратора</span>
                        <textarea
                          value={draft.adminNote}
                          onChange={(event) => updateDraft(item.id, { adminNote: event.target.value })}
                          rows={5}
                          placeholder="Что сделали: выгрузили данные, написали пользователю, обезличили профиль, отказали с причиной и т.д."
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 resize-y"
                        />
                      </label>

                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                        Это ручная отметка обработки. Она не удаляет аккаунт автоматически и не должна заменять проверку чеков, заказов, налогового хранения и обязательств перед пользователем.
                      </div>

                      {Object.keys(item.metadata ?? {}).length > 0 && (
                        <details className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
                          <summary className="cursor-pointer font-medium text-gray-700">Технические метаданные</summary>
                          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(item.metadata, null, 2)}
                          </pre>
                        </details>
                      )}

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
