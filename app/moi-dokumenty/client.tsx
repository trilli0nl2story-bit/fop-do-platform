'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Download, FileText, Loader2, ShoppingBag, Star } from 'lucide-react';
import { CartProvider } from '../../src/context/CartContext';
import { Header } from '../../src/components/Header';
import { PostPurchaseDiscountProvider } from '../../src/context/PostPurchaseDiscountContext';
import { resolveRoute } from '../../src/lib/navigateRoute';
import { useAuthSession } from '../../src/hooks/useAuthSession';

type MaterialAccessTab = 'all' | 'purchase' | 'subscription';

interface AccountSummary {
  user: {
    email: string;
  };
  subscription: {
    status: 'none' | 'active' | 'expired' | 'cancelled' | 'paused';
    currentPeriodEnd: string | null;
  };
  materials: {
    total: number;
    items: Array<{
      id: string;
      slug: string;
      title: string;
      accessType: string;
      grantedAt: string;
      expiresAt: string | null;
    }>;
  };
  orders: {
    total: number;
    items: Array<{
      id: string;
      status: string;
      totalRubles: number;
      createdAt: string;
      paidAt: string | null;
    }>;
  };
}

const ACCESS_LABELS: Record<string, { label: string; className: string }> = {
  purchase: { label: 'Куплен', className: 'bg-green-50 text-green-700 border-green-100' },
  subscription: { label: 'По подписке', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  free: { label: 'Бесплатно', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  admin_grant: { label: 'Доступ открыт', className: 'bg-purple-50 text-purple-700 border-purple-100' },
};

const TAB_LABELS: Array<{ id: MaterialAccessTab; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'purchase', label: 'Купленные' },
  { id: 'subscription', label: 'По подписке' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isPurchaseAccess(accessType: string) {
  return accessType === 'purchase' || accessType === 'admin_grant';
}

function getAccessLabel(accessType: string) {
  return ACCESS_LABELS[accessType] ?? {
    label: accessType,
    className: 'bg-gray-50 text-gray-600 border-gray-100',
  };
}

export function MoiDokumentyClient() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthSession();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [activeTab, setActiveTab] = useState<MaterialAccessTab>('all');
  const [downloadStates, setDownloadStates] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'denied' | 'error'>>({});
  const [downloadMessages, setDownloadMessages] = useState<Record<string, string>>({});

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    setSummaryLoading(true);
    setSummaryError('');
    fetch('/api/account/summary', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data) => setSummary(data))
      .catch(() => setSummaryError('Не удалось загрузить ваши материалы. Попробуйте обновить страницу.'))
      .finally(() => setSummaryLoading(false));
  }, [isAuthenticated]);

  const materials = summary?.materials.items ?? [];
  const visibleMaterials = useMemo(() => {
    if (activeTab === 'purchase') return materials.filter((item) => isPurchaseAccess(item.accessType));
    if (activeTab === 'subscription') return materials.filter((item) => item.accessType === 'subscription');
    return materials;
  }, [activeTab, materials]);

  function getTabCount(tab: MaterialAccessTab) {
    if (tab === 'purchase') return materials.filter((item) => isPurchaseAccess(item.accessType)).length;
    if (tab === 'subscription') return materials.filter((item) => item.accessType === 'subscription').length;
    return materials.length;
  }

  async function handleDownload(slug: string) {
    setDownloadStates((prev) => ({ ...prev, [slug]: 'loading' }));
    setDownloadMessages((prev) => ({ ...prev, [slug]: '' }));

    try {
      const response = await fetch('/api/materials/download', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialSlug: slug }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        const download = data.download ?? {};
        setDownloadStates((prev) => ({ ...prev, [slug]: 'ok' }));
        setDownloadMessages((prev) => ({ ...prev, [slug]: download.message ?? 'Доступ подтверждён.' }));

        if (download.status === 'ready' && typeof download.url === 'string' && download.url) {
          window.open(download.url, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      if (response.status === 403) {
        setDownloadStates((prev) => ({ ...prev, [slug]: 'denied' }));
        setDownloadMessages((prev) => ({ ...prev, [slug]: data.message ?? 'Доступ ограничен.' }));
        return;
      }

      setDownloadStates((prev) => ({ ...prev, [slug]: 'error' }));
      setDownloadMessages((prev) => ({ ...prev, [slug]: 'Не удалось открыть материал. Попробуйте ещё раз.' }));
    } catch {
      setDownloadStates((prev) => ({ ...prev, [slug]: 'error' }));
      setDownloadMessages((prev) => ({ ...prev, [slug]: 'Не удалось открыть материал. Попробуйте ещё раз.' }));
    }
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="my-documents" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <div className="mb-6">
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <FileText className="h-3.5 w-3.5" />
                Личный доступ
              </p>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Мои материалы</h1>
              <p className="mt-2 text-sm text-gray-600">
                Все документы, которые уже доступны вашему аккаунту после покупки, подписки или ручного открытия доступа.
              </p>
            </div>

            {loading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                Проверяем вход...
              </div>
            )}

            {!loading && !isAuthenticated && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Войдите в кабинет</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                  После входа здесь появятся купленные материалы, доступы по подписке и ссылки на скачивание.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/vhod"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/registratsiya"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300"
                  >
                    Создать кабинет
                  </Link>
                </div>
              </div>
            )}

            {!loading && isAuthenticated && (
              <div className="space-y-5">
                {summaryError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {summaryError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Материалы</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{summaryLoading ? '...' : materials.length}</p>
                    <p className="mt-1 text-sm text-gray-500">доступно сейчас</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Подписка</p>
                    <p className={`mt-2 text-base font-semibold ${summary?.subscription.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                      {summaryLoading
                        ? 'Проверяем...'
                        : summary?.subscription.status === 'active'
                          ? 'Активна'
                          : 'Не активна'}
                    </p>
                    {summary?.subscription.currentPeriodEnd && (
                      <p className="mt-1 text-sm text-gray-500">до {formatDate(summary.subscription.currentPeriodEnd)}</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Заказы</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{summaryLoading ? '...' : summary?.orders.total ?? 0}</p>
                    <p className="mt-1 text-sm text-gray-500">в истории аккаунта</p>
                  </div>
                </div>

                <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Доступные документы</h2>
                        <p className="mt-1 text-sm text-gray-500">Открывайте страницу материала или скачивайте файл сразу.</p>
                      </div>
                      <Link
                        href="/materialy/magazin"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        В магазин
                      </Link>
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                      {TAB_LABELS.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {tab.label}
                          <span className="ml-2 rounded-full bg-white/80 px-1.5 py-0.5 text-xs">{getTabCount(tab.id)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {summaryLoading ? (
                    <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Загружаем материалы...
                    </div>
                  ) : visibleMaterials.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {visibleMaterials.map((material) => {
                        const access = getAccessLabel(material.accessType);
                        const state = downloadStates[material.slug] ?? 'idle';
                        const message = downloadMessages[material.slug] ?? '';

                        return (
                          <article key={material.id} className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${access.className}`}>
                                    {access.label}
                                  </span>
                                  <span className="text-xs text-gray-400">открыт {formatDate(material.grantedAt)}</span>
                                </div>
                                <Link
                                  href={`/materialy/magazin/${material.slug}`}
                                  className="text-base font-semibold text-gray-900 transition-colors hover:text-blue-600"
                                >
                                  {material.title}
                                </Link>
                                {material.expiresAt && (
                                  <p className="mt-1 text-xs text-gray-500">Доступ до {formatDate(material.expiresAt)}</p>
                                )}
                                {message && (
                                  <p className={`mt-2 text-xs ${state === 'ok' ? 'text-green-700' : 'text-red-500'}`}>
                                    {message}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2 sm:flex-col">
                                <Link
                                  href={`/materialy/magazin/${material.slug}`}
                                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 sm:flex-none"
                                >
                                  Открыть
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDownload(material.slug)}
                                  disabled={state === 'loading'}
                                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50 sm:flex-none"
                                >
                                  {state === 'loading' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : state === 'ok' ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                  {state === 'loading' ? 'Открываем...' : 'Скачать'}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                        <Star className="h-7 w-7" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">Материалов пока нет</h3>
                      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                        После покупки, подключения подписки или бесплатного скачивания документы появятся здесь автоматически.
                      </p>
                      <Link
                        href="/materialy"
                        className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                      >
                        Перейти к материалам
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
