'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Crown, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthSession } from '../../src/hooks/useAuthSession';
import {
  getSubscriptionPlanMonthlyRubles,
  getSubscriptionPlanTotalRubles,
  SUBSCRIPTION_PLANS,
} from '../../src/server/subscriptionPlans';

type SubscriptionStatus = 'none' | 'active' | 'expired' | 'cancelled' | 'paused';

interface AccountSubscriptionSummary {
  subscription: {
    status: SubscriptionStatus;
    planCode: string | null;
    currentPeriodEnd: string | null;
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PodpiskaCheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuthSession();
  const [selectedPlan, setSelectedPlan] = useState('semiannual');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const [summary, setSummary] = useState<AccountSubscriptionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    setSummaryLoading(true);
    fetch('/api/account/summary', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const paymentState = searchParams.get('payment');
    const orderId = searchParams.get('order');
    if (!paymentState || !orderId) return;

    if (paymentState === 'cancelled') {
      setCheckoutNotice('Оплата подписки не завершена. Заказ сохранён, к нему можно вернуться позже.');
      return;
    }

    if (paymentState !== 'success') return;

    let cancelled = false;

    async function loadOrderStatus() {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          credentials: 'include',
        });
        const data = await response.json().catch(() => ({}));

        if (cancelled || !response.ok || !data?.order) {
          setCheckoutNotice('Платёж отправлен в обработку. Как только Prodamus подтвердит оплату, подписка активируется автоматически.');
          return;
        }

        if (data.order.order.status === 'paid') {
          setCheckoutNotice('Подписка оплачена. Статус обновится в кабинете автоматически.');
          setSummaryLoading(true);
          const refreshed = await fetch('/api/account/summary', { credentials: 'include' });
          if (refreshed.ok && !cancelled) {
            setSummary(await refreshed.json());
          }
          return;
        }

        setCheckoutNotice('Платёж отправлен в обработку. Как только Prodamus подтвердит оплату, подписка активируется автоматически.');
      } catch {
        if (!cancelled) {
          setCheckoutNotice('Платёж отправлен в обработку. Как только Prodamus подтвердит оплату, подписка активируется автоматически.');
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    }

    void loadOrderStatus();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, searchParams]);

  const selectedPlanData = useMemo(
    () => SUBSCRIPTION_PLANS.find((plan) => plan.id === selectedPlan) ?? SUBSCRIPTION_PLANS[0],
    [selectedPlan]
  );

  async function handleCheckout() {
    if (!isAuthenticated) {
      router.push('/vhod');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutNotice('');

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: selectedPlanData.id }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data?.paymentUrl !== 'string') {
        throw new Error(data?.message || 'Не удалось подготовить оплату подписки. Попробуйте ещё раз.');
      }

      window.location.assign(data.paymentUrl);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Не удалось подготовить оплату подписки. Попробуйте ещё раз.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-3">
              <Crown className="w-3.5 h-3.5" />
              Подписка платформы
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Оформить подписку</h1>
            <p className="text-sm text-gray-500 mt-2">
              Библиотека материалов по подписке, 15 AI-запросов в месяц и скидка 25% на магазин.
            </p>
          </div>
          <Link
            href="/materialy/podpiska"
            className="inline-flex items-center px-4 py-2 border border-gray-200 bg-white hover:border-gray-300 text-sm font-medium text-gray-700 rounded-xl"
          >
            К материалам подписки
          </Link>
        </div>

        {checkoutNotice && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {checkoutNotice}
          </div>
        )}

        {checkoutError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {checkoutError}
          </div>
        )}

        {summary?.subscription.status === 'active' && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Подписка уже активна</p>
                <p className="text-sm text-blue-800 mt-1">
                  {summary.subscription.currentPeriodEnd
                    ? `Текущий доступ действует до ${formatDate(summary.subscription.currentPeriodEnd)}.`
                    : 'Доступ уже активирован.'}
                  {' '}Если оплатить новый тариф сейчас, срок продлится автоматически.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Выберите тариф</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const totalRubles = getSubscriptionPlanTotalRubles(plan);
                const monthlyRubles = getSubscriptionPlanMonthlyRubles(plan);
                const selected = plan.id === selectedPlanData.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-amber-400 bg-amber-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{plan.label}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {monthlyRubles.toLocaleString('ru-RU')} ₽ / месяц
                        </p>
                      </div>
                      {plan.discountPercent > 0 && (
                        <span className="inline-flex px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                          −{plan.discountPercent}%
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-4">
                      {totalRubles.toLocaleString('ru-RU')} ₽
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Продление произойдёт на {plan.months} {plan.months === 1 ? 'месяц' : plan.months < 5 ? 'месяца' : 'месяцев'}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Что входит</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                'Доступ ко всем материалам по подписке',
                'Скидка 25% на материалы из магазина',
                '15 AI-запросов в месяц',
                'Новые материалы добавляются регулярно',
                'Продление срока работает автоматически после оплаты',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 mt-5 pt-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">К оплате</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {getSubscriptionPlanTotalRubles(selectedPlanData).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{selectedPlanData.label}</p>
                  <p>{getSubscriptionPlanMonthlyRubles(selectedPlanData).toLocaleString('ru-RU')} ₽ / мес</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutLoading || summaryLoading}
                className="mt-5 w-full inline-flex items-center justify-center px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? 'Переходим к оплате...' : isAuthenticated ? 'Оплатить через Prodamus' : 'Войти и оформить'}
              </button>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                Сумма и срок подписки подтверждаются на сервере. После возврата из Prodamus статус обновится автоматически.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
