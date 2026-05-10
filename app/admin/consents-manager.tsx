'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileCheck2, Loader2, Search, ShieldCheck } from 'lucide-react';

interface ConsentSummary {
  total: number;
  last24h: number;
  checkout: number;
  aiRules: number;
  marketing: number;
}

interface ConsentItem {
  id: string;
  userId: string | null;
  email: string | null;
  phone: string | null;
  formName: string;
  consentType: string;
  documentSlug: string;
  documentVersion: string;
  acceptedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sourceUrl: string | null;
  metadata: Record<string, unknown>;
}

const CONSENT_TYPE_LABELS: Record<string, string> = {
  personal_data: 'ПДн',
  terms: 'Соглашение',
  offer: 'Оферта',
  refund: 'Возврат',
  subscription: 'Подписка',
  marketing: 'Рассылка',
  cookies_analytics: 'Cookie analytics',
  cookies_ads: 'Cookie ads',
  ai_rules: 'AI-правила',
  review_publication: 'Отзыв',
  author_agreement: 'Автор',
};

const FORM_LABELS: Record<string, string> = {
  registration: 'Регистрация',
  store_checkout: 'Покупка',
  subscription_checkout: 'Подписка',
  cookie_banner: 'Cookie',
  document_request: 'Заявка на документ',
  author_application: 'Авторская заявка',
  young_specialist_question: 'Мол. специалист',
  ai_assistant: 'AI-помощник',
  account_privacy: 'Профиль',
};

const CONSENT_FILTERS = [
  ['', 'Все типы'],
  ['personal_data', 'ПДн'],
  ['terms', 'Соглашение'],
  ['offer', 'Оферта'],
  ['refund', 'Возврат'],
  ['subscription', 'Подписка'],
  ['marketing', 'Рассылка'],
  ['cookies_analytics', 'Cookie analytics'],
  ['cookies_ads', 'Cookie ads'],
  ['ai_rules', 'AI-правила'],
] as const;

const FORM_FILTERS = [
  ['', 'Все формы'],
  ['registration', 'Регистрация'],
  ['store_checkout', 'Покупка'],
  ['subscription_checkout', 'Подписка'],
  ['cookie_banner', 'Cookie'],
  ['document_request', 'Заявка на документ'],
  ['author_application', 'Авторская заявка'],
  ['young_specialist_question', 'Мол. специалист'],
  ['ai_assistant', 'AI-помощник'],
  ['account_privacy', 'Профиль'],
] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function labelConsentType(value: string) {
  return CONSENT_TYPE_LABELS[value] ?? value;
}

function labelForm(value: string) {
  return FORM_LABELS[value] ?? value;
}

function metadataPreview(metadata: Record<string, unknown>) {
  const keys = ['orderId', 'paymentId', 'totalRubles', 'planId', 'months', 'promptLength', 'model'];
  const parts = keys
    .filter((key) => metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '')
    .map((key) => `${key}: ${String(metadata[key])}`);

  return parts.length ? parts.join(' · ') : 'metadata без ключевых полей';
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value.toLocaleString('ru-RU')}</p>
    </div>
  );
}

export function ConsentsManager() {
  const [items, setItems] = useState<ConsentItem[]>([]);
  const [summary, setSummary] = useState<ConsentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [form, setForm] = useState('');
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (type) params.set('type', type);
    if (form) params.set('form', form);
    return params.toString();
  }, [form, search, type]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch(`/api/admin/consents?${queryString}`, {
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
          setError('Не удалось загрузить журнал согласий. Обновите страницу.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [queryString]);

  async function downloadCsv() {
    setExporting(true);
    setError('');
    try {
      const params = new URLSearchParams(queryString);
      params.set('export', 'csv');
      const response = await fetch(`/api/admin/consents?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dnl-consents-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Не удалось выгрузить CSV. Попробуйте ещё раз.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Журнал согласий</h1>
          <p className="text-sm text-gray-500">
            Доказательства согласий: документ, версия, форма, дата, пользователь, IP, источник и служебные metadata.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void downloadCsv()}
          disabled={exporting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Выгрузить CSV
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatPill label="Всего" value={summary.total} />
          <StatPill label="За 24 часа" value={summary.last24h} />
          <StatPill label="Оплата" value={summary.checkout} />
          <StatPill label="AI-правила" value={summary.aiRules} />
          <StatPill label="Рассылка" value={summary.marketing} />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col lg:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email, телефону, user id или consent id"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          {CONSENT_FILTERS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={form}
          onChange={(event) => setForm(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          {FORM_FILTERS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center px-4">
            <FileCheck2 className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Записей согласий пока нет</p>
            <p className="text-xs text-gray-400 mt-1">Они появятся после регистраций, оплат, cookie-выбора и AI-запросов.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {labelConsentType(item.consentType)}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {labelForm(item.formName)}
                      </span>
                      <span className="rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                        {item.documentSlug} · {item.documentVersion}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-900 break-all">
                      {item.email || item.phone || item.userId || 'анонимный пользователь'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 break-all">{item.id}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-sm font-medium text-gray-900">{formatDate(item.acceptedAt)}</p>
                    {item.ipAddress && <p className="text-xs text-gray-500 mt-1">IP: {item.ipAddress}</p>}
                  </div>
                </div>

                <div className="grid gap-2 text-xs text-gray-500">
                  {item.sourceUrl && (
                    <p className="break-all">
                      <span className="font-semibold text-gray-600">Источник:</span> {item.sourceUrl}
                    </p>
                  )}
                  <p className="break-all">
                    <span className="font-semibold text-gray-600">Metadata:</span> {metadataPreview(item.metadata)}
                  </p>
                  {item.userAgent && (
                    <p className="break-all">
                      <span className="font-semibold text-gray-600">User-Agent:</span> {item.userAgent}
                    </p>
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
