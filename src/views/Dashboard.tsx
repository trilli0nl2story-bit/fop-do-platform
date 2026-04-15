import { FileText, Bot, Package, TrendingUp, Clock, PenLine, Crown, Zap, HelpCircle, Gift, ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { usePostPurchaseDiscount } from '../context/PostPurchaseDiscountContext';
import { InlineActivityHint } from '../components/InlineActivityHint';

const DASHBOARD_HINTS = [
  'Сейчас чаще выбирают: КТП на неделю',
  'Только что скачали: диагностику 4–5 лет',
  'Сейчас чаще выбирают: конспект занятия по природе',
  'Только что скачали: сценарий родительского собрания',
  'Популярно сегодня: КТП по ФОП ДО для средней группы',
  'Только что скачали: рабочую программу на учебный год',
  'Сейчас чаще выбирают: диагностику на начало года',
  'Только что скачали: план воспитательной работы',
];

interface DashboardProps {
  onNavigate: (page: string) => void;
  hasSubscription?: boolean;
}

function formatTimeRemaining(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return '0 часов';
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0 && hours > 0) return `${days} ${days === 1 ? 'день' : 'дня'} ${hours} ${hours === 1 ? 'час' : 'часа'}`;
  if (days > 0) return `${days} ${days === 1 ? 'день' : 'дня'}`;
  if (hours === 1) return '1 час';
  if (hours < 5) return `${hours} часа`;
  return `${hours} часов`;
}

export function Dashboard({ onNavigate, hasSubscription = false }: DashboardProps) {
  const { discount, hoursRemaining } = usePostPurchaseDiscount();
  const hasActiveDiscount = discount && !discount.used;
  const isExpiringSoon = hoursRemaining !== null && hoursRemaining <= 6;
  const mainActions = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'Спросить помощника',
      description: 'Можно посмотреть примеры. Отправка запросов доступна по подписке.',
      color: 'bg-green-500',
      page: 'assistant',
      badge: 'тестовый режим',
      badgeClass: 'bg-gray-100 text-gray-500 border border-gray-200',
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Мои материалы',
      description: 'Сохраненные и созданные документы',
      color: 'bg-amber-500',
      page: 'my-documents',
      badge: null,
      badgeClass: '',
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: 'Заказать документ',
      description: 'Заявки принимаются, подготовка и проверка идут вручную.',
      color: 'bg-teal-500',
      page: 'request-document',
      badge: 'ручная обработка',
      badgeClass: 'bg-blue-50 text-blue-600 border border-blue-200',
    },
    {
      icon: <PenLine className="w-8 h-8" />,
      title: 'Стать автором',
      description: 'Мы готовим авторский кабинет. Пока можно оставить заявку.',
      color: 'bg-green-600',
      page: 'become-author',
      badge: 'скоро',
      badgeClass: 'bg-gray-100 text-gray-500 border border-gray-200',
    },
    {
      icon: <HelpCircle className="w-8 h-8" />,
      title: 'Молодой специалист',
      description: 'Задайте вопрос эксперту или откройте базу ответов',
      color: 'bg-teal-500',
      page: 'young-specialist',
      badge: null,
      badgeClass: '',
    }
  ];

  const recentDocuments = [
    { title: 'Конспект занятия по экологии', category: 'Средняя группа', date: '15 марта 2024' },
    { title: 'План-конспект "Весна идет"', category: 'Старшая группа', date: '14 марта 2024' },
    { title: 'Методические рекомендации', category: 'ФОП ДО', date: '13 марта 2024' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Методический кабинет
        </h1>
        <p className="text-sm text-gray-500">Выберите раздел — материалы откроются сразу</p>
      </div>

      {hasActiveDiscount && (
        <div className={`mb-6 rounded-xl border-2 p-4 sm:p-5 ${isExpiringSoon ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpiringSoon ? 'bg-red-100' : 'bg-amber-100'}`}>
                <Gift className={`w-5 h-5 ${isExpiringSoon ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <p className={`font-semibold text-base ${isExpiringSoon ? 'text-red-900' : 'text-amber-900'}`}>
                  У вас активна скидка {discount!.discountAmount} ₽ на следующий материал
                </p>
                <div className={`flex items-center gap-1.5 mt-1 text-sm ${isExpiringSoon ? 'text-red-700 font-semibold' : 'text-amber-700'}`}>
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Осталось: {formatTimeRemaining(discount!.expiresAt)}</span>
                </div>
                {hasSubscription && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-800">У вас уже действует максимальная скидка 25%</p>
                  </div>
                )}
              </div>
            </div>
            {!hasSubscription && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
                onClick={() => onNavigate('store-materials')}
              >
                Использовать скидку
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Какой раздел хотите открыть?</h2>
        <p className="text-sm text-gray-500 mb-3">Выберите раздел — материалы откроются сразу</p>
        <div className="flex items-center gap-2.5 mb-4 px-3.5 py-2.5 bg-green-50 border border-green-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            <InlineActivityHint messages={DASHBOARD_HINTS} intervalMs={15000} intervalJitterMs={10000} />
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('free-materials')}
            className="text-left bg-white border-2 border-gray-200 hover:border-green-300 rounded-xl p-4 sm:p-5 transition-all hover:shadow-sm group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-xl" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                Начните здесь
              </span>
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Бесплатно</p>
            <p className="text-sm text-gray-500 leading-snug mb-2.5">Материалы, доступные бесплатно</p>
            <p className="text-xs font-semibold text-green-600 group-hover:text-green-700 flex items-center gap-0.5 transition-colors">
              Открыть бесплатные материалы <ChevronRight className="w-3 h-3" />
            </p>
          </button>

          <button
            onClick={() => onNavigate('subscription-materials')}
            className="text-left bg-white border-2 border-gray-200 hover:border-amber-300 rounded-xl p-4 sm:p-5 transition-all hover:shadow-sm group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl" />
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">По подписке</p>
            <p className="text-sm text-gray-500 leading-snug mb-2.5">Материалы по активной подписке</p>
            <p className="text-xs font-semibold text-amber-600 group-hover:text-amber-700 flex items-center gap-0.5 transition-colors">
              Посмотреть библиотеку подписки <ChevronRight className="w-3 h-3" />
            </p>
          </button>

          <button
            onClick={() => onNavigate('store-materials')}
            className="text-left bg-white border-2 border-gray-200 hover:border-blue-300 rounded-xl p-4 sm:p-5 transition-all hover:shadow-sm group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Магазин</p>
            <p className="text-sm text-gray-500 leading-snug mb-2.5">Документы, которые можно купить отдельно</p>
            <p className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-0.5 transition-colors">
              Перейти к покупкам <ChevronRight className="w-3 h-3" />
            </p>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {mainActions.map((action, index) => (
          <Card
            key={index}
            onClick={() => onNavigate(action.page)}
            className="cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1 sm:mb-2">
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  {action.badge && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${action.badgeClass}`}>
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card hover={false} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Подписка</h2>
              <p className="text-xs sm:text-sm text-gray-500">278 ₽/мес — 15 AI-запросов, премиум-библиотека, скидка 25%</p>
            </div>
          </div>
          <Button size="sm" onClick={() => onNavigate('subscription')}>
            Оформить подписку
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Тариф</p>
            <p className="text-sm font-semibold text-gray-400">Не активна</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">AI включено</p>
            <p className="text-sm font-semibold text-gray-900">15 / мес</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">AI использовано</p>
            <p className="text-sm font-semibold text-gray-900">0</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">AI осталось</p>
            <p className="text-sm font-semibold text-gray-900">0</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onNavigate('subscription')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium hover:bg-amber-100 transition-colors flex-1"
          >
            <Crown className="w-4 h-4" />
            Оформить подписку
          </button>
          <button
            onClick={() => onNavigate('subscription')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors flex-1"
          >
            <Zap className="w-4 h-4" />
            Докупить запросы
          </button>
        </div>
      </Card>

      <Card hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Недавно просмотренные</h2>
        </div>
        <div className="space-y-3">
          {recentDocuments.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{doc.title}</h3>
                <p className="text-sm text-gray-600">{doc.category}</p>
              </div>
              <span className="text-sm text-gray-500">{doc.date}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
