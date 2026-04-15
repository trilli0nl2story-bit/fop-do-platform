import { useState } from 'react';
import { ShoppingCart, Trash2, Tag, FileText, CreditCard, Crown, Gift, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { useCart } from '../context/CartContext';
import { usePostPurchaseDiscount } from '../context/PostPurchaseDiscountContext';

interface CartProps {
  onNavigate: (page: string) => void;
  hasSubscription?: boolean;
  isAuthenticated?: boolean;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  PPT: 'bg-orange-50 text-orange-600'
};

export function Cart({ onNavigate, hasSubscription = false }: CartProps) {
  const { items, removeItem, clearCart, total } = useCart();
  const { discount, grantDiscount, applyDiscount } = usePostPurchaseDiscount();
  const [consentGiven, setConsentGiven] = useState(false);

  const subscriptionDiscount = hasSubscription ? Math.round(total * 0.25) : 0;
  const potentialSavings = Math.round(total * 0.25);

  const activeReturnDiscount = (!hasSubscription && discount && !discount.used) ? discount.discountAmount : 0;
  const finalTotal = Math.max(0, total - subscriptionDiscount - activeReturnDiscount);

  const handlePayment = () => {
    const orderTotal = total;
    if (activeReturnDiscount > 0) applyDiscount();
    grantDiscount(orderTotal);
    clearCart();
    onNavigate('payment_creating');
    window.setTimeout(() => onNavigate('payment_success_product'), 1800);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Корзина пуста</h2>
        <p className="text-gray-600 mb-6">Добавьте материалы из библиотеки документов</p>
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
        <p className="text-gray-600">{items.length} {items.length === 1 ? 'документ' : 'документа'}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.id} hover={false}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fileTypeColors[item.fileType]}`}>
                      {item.fileType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    {hasSubscription && (
                      <span className="text-sm text-gray-400 line-through block">{item.price} ₽</span>
                    )}
                    <span className="font-bold text-gray-900 text-lg">
                      {hasSubscription ? Math.round(item.price * 0.75) : item.price} ₽
                    </span>
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
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card hover={false} className="sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Итого</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Документы ({items.length} шт.)</span>
                <span>{total} ₽</span>
              </div>

              {hasSubscription && (
                <div className="flex items-center justify-between text-green-600 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-medium">Скидка подписки −25%</span>
                  </div>
                  <span className="font-semibold">−{subscriptionDiscount} ₽</span>
                </div>
              )}

              {activeReturnDiscount > 0 && (
                <div className="flex items-center justify-between text-amber-700 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    <span className="text-sm font-medium">Скидка применена</span>
                  </div>
                  <span className="font-semibold">−{activeReturnDiscount} ₽</span>
                </div>
              )}

              {hasSubscription && discount && !discount.used && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500">У вас уже действует максимальная скидка 25%</p>
                </div>
              )}

              {!hasSubscription && !activeReturnDiscount && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-800 font-semibold">С подпиской выгоднее</p>
                  </div>
                  <p className="text-xs text-amber-700 mb-1">Скидка 25% на все материалы магазина</p>
                  <p className="text-xs text-amber-800 font-semibold">
                    С этим заказом: −{potentialSavings} ₽
                  </p>
                  <button
                    onClick={() => onNavigate('subscription')}
                    className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-800 underline"
                  >
                    Получить скидку 25%
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 text-lg">К оплате</span>
                <span className="font-bold text-2xl text-gray-900">{finalTotal} ₽</span>
              </div>
            </div>

            <div className="mb-4">
              <ConsentCheckbox
                checked={consentGiven}
                onChange={setConsentGiven}
                onNavigate={onNavigate}
              />
            </div>

            <Button className="w-full" size="lg" disabled={!consentGiven} onClick={handlePayment}>
              <CreditCard className="w-5 h-5" />
              Оплатить
            </Button>

            <button
              onClick={() => onNavigate('store-materials')}
              className="w-full text-center text-sm text-blue-500 hover:text-blue-600 mt-3 py-2"
            >
              Продолжить покупки
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
