'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Loader2, Search, Wallet } from 'lucide-react';

interface PaymentSummary {
  paidTotalRubles: number;
  succeededCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
}

interface PaymentItem {
  id: string;
  orderId: string;
  userEmail: string;
  status: string;
  provider: string;
  providerPaymentId: string | null;
  amountRubles: number;
  createdAt: string;
  paidAt: string | null;
  orderStatus: string;
  kind: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает оплаты',
  succeeded: 'Оплачен',
  failed: 'Ошибка',
  refunded: 'Возврат',
};

export function RevenueManager() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [items, setItems] = useState<PaymentItem[]>([]);
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

    fetch(`/api/admin/payments?${params.toString()}`, {
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
          setError('Не удалось загрузить платежи и выручку. Обновите страницу.');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Выручка и платежи</h1>
        <p className="text-sm text-gray-500">
          Реальные платежи, статусы Prodamus и общий денежный поток по платформе.
        </p>
      </div>

      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Оплачено</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.paidTotalRubles.toLocaleString('ru-RU')} ₽
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Успешные платежи</p>
            <p className="text-2xl font-bold text-gray-900">{summary.succeededCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Ожидают оплаты</p>
            <p className="text-2xl font-bold text-gray-900">{summary.pendingCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Ошибки / возвраты</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.failedCount + summary.refundedCount}
            </p>
          </div>
        </section>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email, order id или payment id"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидают оплаты</option>
          <option value="succeeded">Успешные</option>
          <option value="failed">Ошибки</option>
          <option value="refunded">Возвраты</option>
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
            <CreditCard className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">Платежей пока нет</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 break-all">{item.userEmail}</p>
                    <p className="text-xs text-gray-500 break-all">
                      payment {item.id} · order {item.orderId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {item.amountRubles.toLocaleString('ru-RU')} ₽
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {PAYMENT_STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                    Order: {item.orderStatus}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                    {item.provider}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                    {item.kind === 'subscription' ? 'Подписка' : 'Покупка материалов'}
                  </span>
                  {item.providerPaymentId && (
                    <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                      #{item.providerPaymentId}
                    </span>
                  )}
                </div>

                {item.paidAt && (
                  <p className="text-xs text-green-700">Оплачен: {formatDate(item.paidAt)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
