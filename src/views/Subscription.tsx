import { useState } from 'react';
import { Crown, Check, Sparkles, BookOpen, Bot, Package, Tag, ArrowLeft, Zap } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { InlineActivityBadge } from '../components/InlineActivityBadge';

interface SubscriptionProps {
  onNavigate: (page: string) => void;
}

const BASE_PRICE = 278;

const plans = [
  { id: 'monthly', label: '1 месяц', months: 1, discount: 0 },
  { id: 'quarterly', label: '3 месяца', months: 3, discount: 10 },
  { id: 'semiannual', label: '6 месяцев', months: 6, discount: 15 },
  { id: 'annual', label: '12 месяцев', months: 12, discount: 25 },
] as const;

const benefits = [
  { icon: <Bot className="w-5 h-5" />, title: '15 AI-запросов в месяц', description: 'Генерация документов, ответы на вопросы, создание по шаблону' },
  { icon: <BookOpen className="w-5 h-5" />, title: 'Премиум-библиотека', description: 'Доступ к закрытому каталогу документов' },
  { icon: <Package className="w-5 h-5" />, title: 'Заказ документов', description: 'Возможность заказать индивидуальную подготовку материалов' },
  { icon: <Tag className="w-5 h-5" />, title: 'Скидка 25%', description: 'На все покупки документов в магазине' },
];

const aiPackages = [
  { id: 's', name: 'Пакет S', requests: 10, price: 149 },
  { id: 'm', name: 'Пакет M', requests: 25, price: 299 },
  { id: 'l', name: 'Пакет L', requests: 60, price: 599 },
];

export function Subscription({ onNavigate }: SubscriptionProps) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [consentGiven, setConsentGiven] = useState(false);

  const getPrice = (months: number, discount: number) => {
    const total = BASE_PRICE * months;
    return Math.round(total * (1 - discount / 100));
  };

  const getMonthly = (months: number, discount: number) => {
    return Math.round(getPrice(months, discount) / months);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        В кабинет
      </button>

      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Подписка на платформу</h1>
        <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
          Получите полный доступ к платформе и экономьте на каждой покупке
        </p>
      </div>

      <div className="mb-10">
        <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 rounded-2xl p-6 sm:p-8 shadow-lg shadow-amber-100/50">
          <span className="absolute -top-3 left-6 px-4 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
            Основной тариф
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ежемесячная подписка</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">{BASE_PRICE} ₽</span>
                <span className="text-gray-500">/ месяц</span>
              </div>
              <ul className="space-y-2">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {b.title}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:text-right flex-shrink-0">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600"
                onClick={() => { setSelectedPlan('monthly'); document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                <Crown className="w-5 h-5" />
                Оформить подписку
              </Button>
              <InlineActivityBadge className="mt-3 justify-center sm:justify-end" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Выгоднее с долгосрочным тарифом</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.filter(p => p.months > 1).map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isRecommended = plan.id === 'semiannual';
            const total = getPrice(plan.months, plan.discount);
            const monthly = getMonthly(plan.months, plan.discount);

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-5 border-2 text-left transition-all ${
                  isRecommended
                    ? isSelected
                      ? 'border-amber-400 bg-amber-50/80 shadow-lg shadow-amber-100'
                      : 'border-amber-300 bg-amber-50/50 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100'
                    : isSelected
                    ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-100'
                    : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-0.5 bg-amber-400 text-white text-xs font-bold rounded-full whitespace-nowrap shadow-sm">
                    <Crown className="w-3 h-3" />
                    Чаще выбирают коллеги
                  </span>
                )}
                {plan.discount > 0 && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    -{plan.discount}%
                  </span>
                )}
                <div className={`mb-3 ${isRecommended ? 'pt-2' : 'pt-1'}`}>
                  {isRecommended && (
                    <p className="text-xs text-amber-600 font-medium mb-0.5">Оптимальный вариант</p>
                  )}
                  <h3 className="text-lg font-bold text-gray-900">{plan.label}</h3>
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">{monthly} ₽</span>
                  <span className="text-gray-500 text-sm"> / мес</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Итого: <span className="font-semibold text-gray-700">{total} ₽</span>
                </p>
                <p className="text-xs text-green-600 font-medium">
                  Экономия {BASE_PRICE * plan.months - total} ₽
                </p>
                <div className={`mt-3 w-full py-2 rounded-lg text-center text-sm font-medium transition-colors ${
                  isRecommended
                    ? isSelected
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : isSelected
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isSelected
                    ? 'Выбран'
                    : isRecommended
                    ? 'Выбрать 6 месяцев'
                    : 'Выбрать'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card hover={false}>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Что включено в подписку</h2>
          <div className="space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
                  <p className="text-sm text-gray-600">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Сравнение</h2>
          <div className="space-y-3">
            {[
              { feature: 'Доступ к базовым документам', free: true, premium: true },
              { feature: '15 AI-запросов / мес', free: false, premium: true },
              { feature: 'Премиум-библиотека', free: false, premium: true },
              { feature: 'Заказ документов', free: false, premium: true },
              { feature: 'Скидка 25% в магазине', free: false, premium: true },
              { feature: 'Без ограничений скачивания', free: false, premium: true },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 flex-1 min-w-0">{row.feature}</span>
                <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                  <div className="w-14 sm:w-16 text-center">
                    {i === 0 && <span className="text-xs text-gray-400 font-medium">Без</span>}
                    {row.free ? (
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </div>
                  <div className="w-14 sm:w-16 text-center">
                    {i === 0 && <span className="text-xs text-amber-500 font-medium">Премиум</span>}
                    <Check className="w-4 h-4 text-green-500 mx-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">Дополнительные AI-запросы</h2>
          </div>
          <p className="text-gray-600 text-sm">Нужно больше? Докупите пакет запросов к вашей подписке</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {aiPackages.map((pkg) => (
            <Card key={pkg.id} hover={false} className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{pkg.requests} дополнительных AI-запросов</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">{pkg.price} ₽</p>
              <Button variant="secondary" className="w-full">
                Купить пакет
              </Button>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          Дополнительные пакеты доступны только при активной подписке.
        </p>
      </div>

      <Card hover={false} className="max-w-lg mx-auto" id="checkout">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">Оформить подписку</h3>
          </div>
          {(() => {
            const plan = plans.find(p => p.id === selectedPlan)!;
            const total = getPrice(plan.months, plan.discount);
            return (
              <p className="text-gray-600 text-sm">
                Тариф: <span className="font-semibold">{plan.label}</span> — <span className="font-bold text-gray-900">{total} ₽</span>
              </p>
            );
          })()}
        </div>

        <div className="mb-5">
          <ConsentCheckbox
            checked={consentGiven}
            onChange={setConsentGiven}
            onNavigate={onNavigate}
          />
        </div>

        <Button
          className="w-full bg-amber-500 hover:bg-amber-600"
          size="lg"
          disabled={!consentGiven}
          onClick={() => {
            onNavigate('payment_creating');
            window.setTimeout(() => onNavigate('payment_success_subscription'), 1800);
          }}
        >
          <Crown className="w-5 h-5" />
          Оформить подписку
        </Button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Подписка продлевается автоматически. Вы можете отменить в любое время.
        </p>
      </Card>
    </div>
  );
}
