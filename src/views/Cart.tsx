import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock3,
  CreditCard,
  FileText,
  ShoppingCart,
  Tag,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useCart } from '../context/CartContext';

interface CartProps {
  onNavigate: (page: string) => void;
  hasSubscription?: boolean;
  isAuthenticated?: boolean;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  PPT: 'bg-orange-50 text-orange-600',
  PPTX: 'bg-orange-50 text-orange-600',
};

function unavailableMessage(reason: 'not_found' | 'not_store' | 'not_published') {
  if (reason === 'not_store') return 'Материал больше не продаётся отдельно.';
  if (reason === 'not_published') return 'Материал временно снят с публикации.';
  return 'Материал не найден в каталоге.';
}

export function Cart({ onNavigate, isAuthenticated }: CartProps) {
  const {
    items,
    removeItem,
    clearCart,
    total,
    quote,
    quoteLoading,
    quoteError,
    referralCode,
    setReferralCode,
  } = useCart();
  const [referralDraft, setReferralDraft] = useState(referralCode);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  useEffect(() => {
    setReferralDraft(referralCode);
  }, [referralCode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const paymentState = url.searchParams.get('payment');
    const orderId = url.searchParams.get('order');

    if (!paymentState || !orderId) return;

    if (paymentState === 'cancelled') {
      setCheckoutNotice('Оплата не завершена. Заказ сохранён, к оплате можно вернуться позже.');
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
          setCheckoutNotice(
            'Платёж отправлен в обработку. Как только Prodamus подтвердит оплату, доступ появится в кабинете.'
          );
          return;
        }

        if (data.order.order.status === 'paid') {
          clearCart();
          setCheckoutNotice('Оплата подтверждена. Материалы уже добавлены в ваш кабинет.');
          return;
        }

        setCheckoutNotice(
          'Платёж отправлен в обработку. Как только Prodamus подтвердит оплату, доступ появится в кабинете.'
        );
      } catch {
        if (!cancelled) {
          setCheckoutNotice(
            'Платёж отправлен в обработку. Как только Prodamus подтвердит оплату, доступ появится в кабинете.'
          );
        }
      }
    }

    void loadOrderStatus();

    return () => {
      cancelled = true;
    };
  }, [clearCart]);

  const quoteItemsBySlug = useMemo(() => {
    const map = new Map<string, NonNullable<typeof quote>['items'][number]>();
    for (const item of quote?.items ?? []) {
      map.set(item.slug, item);
    }
    return map;
  }, [quote]);

  const displayItems = items.map((item) => {
    const quoted = item.slug ? quoteItemsBySlug.get(item.slug) : null;
    return {
      ...item,
      quote: quoted ?? null,
    };
  });

  const hasUnavailableItems = displayItems.some((item) => item.quote && !item.quote.available);

  const handleApplyReferral = () => {
    setReferralCode(referralDraft.trim());
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      onNavigate('login');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutNotice(null);

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items
            .map((item) => ({ slug: item.slug?.trim() ?? '' }))
            .filter((item) => item.slug.length > 0),
          referralCode: referralCode.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data?.paymentUrl !== 'string') {
        throw new Error(data?.message || 'Не удалось подготовить оплату. Попробуйте ещё раз.');
      }

      window.location.assign(data.paymentUrl);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Не удалось подготовить оплату. Попробуйте ещё раз.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Корзина пуста</h2>
        <p className="text-gray-600 mb-6">
          Добавьте материалы из магазина, и мы сразу пересчитаем итоговую сумму на сервере.
        </p>
        <Button onClick={() => onNavigate('store-materials')}>
          Перейти в магазин
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Корзина</h1>
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? 'материал' : items.length < 5 ? 'материала' : 'материалов'}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {checkoutNotice && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {checkoutNotice}
            </div>
          )}

          {quoteError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {quoteError}
            </div>
          )}

          {checkoutError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {checkoutError}
            </div>
          )}

          {displayItems.map((item) => {
            const quoted = item.quote;
            const unavailable = quoted && !quoted.available;

            return (
              <Card key={item.id} hover={false}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{quoted?.title ?? item.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600">{quoted?.category ?? item.category}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fileTypeColors[quoted?.fileType ?? item.fileType]}`}>
                        {quoted?.fileType ?? item.fileType}
                      </span>
                    </div>

                    {unavailable && quoted.reason !== 'ok' && (
                      <div className="mt-3 inline-flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{unavailableMessage(quoted.reason)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      {quoteLoading && !quoted ? (
                        <span className="text-sm text-gray-400 block">Пересчёт...</span>
                      ) : quoted ? (
                        <>
                          {quoted.discountAmountRubles > 0 && (
                            <span className="text-sm text-gray-400 line-through block">
                              {quoted.unitPriceRubles.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                          <span className={`font-bold text-lg ${unavailable ? 'text-gray-400' : 'text-gray-900'}`}>
                            {quoted.finalPriceRubles.toLocaleString('ru-RU')} ₽
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-900 text-lg">
                          {item.price.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card hover={false} className="sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Итого</h3>

            <div className="space-y-4 mb-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Реферальный код</label>
                <div className="flex gap-2">
                  <Input
                    value={referralDraft}
                    onChange={(event) => setReferralDraft(event.target.value)}
                    placeholder="Например, ABC123"
                    className="py-2.5"
                  />
                  <Button variant="secondary" onClick={handleApplyReferral}>
                    Применить
                  </Button>
                </div>
                {quote?.referral.message && (
                  <p className={`text-xs ${quote.referral.applied ? 'text-green-600' : 'text-amber-700'}`}>
                    {quote.referral.message}
                  </p>
                )}
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Материалы ({items.length} шт.)</span>
                <span>{quote?.subtotalRubles.toLocaleString('ru-RU') ?? total.toLocaleString('ru-RU')} ₽</span>
              </div>

              {quoteLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock3 className="w-4 h-4" />
                  <span>Пересчитываем корзину на сервере...</span>
                </div>
              )}

              {quote?.discounts.map((discount) => (
                <div key={discount.code} className="flex items-center justify-between text-green-700 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {discount.label} −{discount.appliedPercent}%
                    </span>
                  </div>
                  <span className="font-semibold">−{discount.amountRubles.toLocaleString('ru-RU')} ₽</span>
                </div>
              ))}

              {quote && quote.totalDiscountPercent > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Общая скидка на корзину: <span className="font-semibold">{quote.totalDiscountPercent}%</span>.
                  Максимум по правилам проекта — {quote.maxDiscountPercent}%.
                </div>
              )}

              {hasUnavailableItems && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  В корзине есть материалы, которые сейчас нельзя купить. Удалите их, и расчёт снова станет доступен для оформления.
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 text-lg">К оплате</span>
                <span className="font-bold text-2xl text-gray-900">
                  {(quote?.totalRubles ?? total).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={
                checkoutLoading ||
                quoteLoading ||
                !quote?.checkoutReady ||
                hasUnavailableItems
              }
            >
              <CreditCard className="w-5 h-5" />
              {checkoutLoading
                ? 'Переходим к оплате...'
                : isAuthenticated
                  ? 'Оплатить через Prodamus'
                  : 'Войти и оплатить'}
            </Button>

            <p className="mt-3 text-xs text-gray-500 leading-relaxed">
              Сумма заказа и скидки подтверждаются на сервере прямо перед оплатой. После возврата из Prodamus
              мы проверяем статус заказа и автоматически открываем доступ в кабинете.
            </p>

            <button
              onClick={() => onNavigate('store-materials')}
              className="w-full text-center text-sm text-blue-500 hover:text-blue-600 mt-3 py-2"
            >
              Продолжить покупки
            </button>

            <button
              onClick={clearCart}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-1 py-2"
            >
              Очистить корзину
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
