import { useRef, useState } from 'react';
import { Search, Crown, CheckCircle, ChevronRight, BookOpen, FileText, Layers, Video, MessageSquare, TreePine, Pencil, Calendar, Monitor, Users, Bell, ClipboardList, Star, Grid2x2 as Grid, Image } from 'lucide-react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { MaterialDocCard } from '../../components/MaterialDocCard';
import { getMergedSubscriptionMaterials } from '../../lib/cmsProducts';
import { getPopularityLabel } from '../../data/notifications';

interface SubscriptionMaterialsProps {
  onNavigate: (page: string) => void;
  hasSubscription?: boolean;
  isAuthenticated?: boolean;
}

const ALL_CATEGORIES = [
  'Все категории',
  'Комплекты материалов',
  'Говорящая среда ДОО',
  'Материалы для работы с детьми',
  'Рабочие листы по темам недели',
  'Посты для госпаблика / чата с родителями',
  'Интересные прогулки',
  'Схемы поэтапного рисования',
  'Линейный календарь по месяцам',
  'Интерактивные презентации и викторины',
  'Работа с родителями',
  'Стенды «Читаем дома вместе»',
  'Объявления для родителей',
  'ФОП ДО: документы и материалы',
  'Календарь праздников и юбилеев',
  'Образовательные области ФОП ДО',
  'Вебинары и видеоуроки',
  'Картотеки картин по ФОП ДО',
];

const PREVIEW_CARDS = [
  {
    icon: Layers,
    color: 'blue',
    title: 'Комплекты материалов',
    count: 6,
    examples: ['Постеры по темам недели', 'Адвент-календарь', 'Планы самообразования'],
  },
  {
    icon: BookOpen,
    color: 'green',
    title: 'Говорящая среда ДОО',
    count: 14,
    examples: ['Стенд «Приветствий»', 'Экран эмоций группы', 'Стенд «Азбука темы»'],
  },
  {
    icon: FileText,
    color: 'amber',
    title: 'Материалы для работы с детьми',
    count: 26,
    examples: ['Карточки о комнатных растениях', 'Игры с кубиками', 'Игра «Цветные домики»'],
  },
  {
    icon: FileText,
    color: 'rose',
    title: 'Рабочие листы по темам недели',
    count: 9,
    examples: ['Армия и транспорт', 'Музей', 'Город'],
  },
  {
    icon: Video,
    color: 'sky',
    title: 'Вебинары и видеоуроки',
    count: 22,
    examples: ['Квесты в детском саду', 'Самообразование педагога', 'Организация выбора детей'],
  },
  {
    icon: MessageSquare,
    color: 'teal',
    title: 'Посты для госпаблика / чата с родителями',
    count: 12,
    examples: ['Посты на сентябрь', 'Посты на январь', 'Посты на май'],
  },
  {
    icon: TreePine,
    color: 'lime',
    title: 'Интересные прогулки',
    count: 5,
    examples: ['Карточки-находилки', 'Карточки наблюдения на прогулке', 'Книга наблюдений на площадке'],
  },
  {
    icon: Pencil,
    color: 'orange',
    title: 'Схемы поэтапного рисования',
    count: 6,
    examples: ['Схемы на тему космоса', 'Схемы фруктов, овощей и ягод', 'Схемы военной техники и профессий'],
  },
  {
    icon: Calendar,
    color: 'cyan',
    title: 'Линейный календарь по месяцам',
    count: 12,
    examples: ['Сентябрь + вводные материалы', 'Январь', 'Май'],
  },
  {
    icon: Monitor,
    color: 'violet',
    title: 'Интерактивные презентации и викторины',
    count: 4,
    examples: ['Презентация по ПДД', 'Викторина «День космонавтики»', 'Викторина «День Победы»'],
  },
  {
    icon: Users,
    color: 'pink',
    title: 'Работа с родителями',
    count: 10,
    examples: ['Памятка для родителей на собрание', 'Комплект для мастер-класса', 'Стенд «Забота о детских зубах»'],
  },
  {
    icon: BookOpen,
    color: 'emerald',
    title: 'Стенды «Читаем дома вместе»',
    count: 4,
    examples: ['Лесные зверята', 'Дружба крепкая', 'До свидания, лето'],
  },
  {
    icon: Bell,
    color: 'yellow',
    title: 'Объявления для родителей',
    count: 2,
    examples: ['Объявление о выходных', 'Объявление о выставках'],
  },
  {
    icon: ClipboardList,
    color: 'slate',
    title: 'ФОП ДО: документы и материалы',
    count: 9,
    examples: ['Темы недели 2025–2026', 'Планируемые результаты', 'Паспорт группы'],
  },
  {
    icon: Star,
    color: 'fuchsia',
    title: 'Календарь праздников и юбилеев',
    count: 12,
    examples: ['Январь 2025', 'Май 2025', 'Декабрь 2025'],
  },
  {
    icon: Grid,
    color: 'indigo',
    title: 'Образовательные области ФОП ДО',
    count: 11,
    examples: ['Социально-коммуникативное развитие', 'Познавательное развитие', 'Речевое развитие'],
  },
  {
    icon: Image,
    color: 'red',
    title: 'Картотеки картин по ФОП ДО',
    count: 7,
    examples: ['Осенние картины', 'Зимние картины', 'Картины о Великой Отечественной войне'],
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string; activeBorder: string }> = {
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-500',    badge: 'bg-blue-100 text-blue-700',       activeBorder: 'border-blue-400'    },
  green:   { bg: 'bg-green-50',   icon: 'text-green-600',   badge: 'bg-green-100 text-green-700',     activeBorder: 'border-green-400'   },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700',     activeBorder: 'border-amber-400'   },
  rose:    { bg: 'bg-rose-50',    icon: 'text-rose-500',    badge: 'bg-rose-100 text-rose-700',       activeBorder: 'border-rose-400'    },
  sky:     { bg: 'bg-sky-50',     icon: 'text-sky-600',     badge: 'bg-sky-100 text-sky-700',         activeBorder: 'border-sky-400'     },
  teal:    { bg: 'bg-teal-50',    icon: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700',       activeBorder: 'border-teal-400'    },
  lime:    { bg: 'bg-lime-50',    icon: 'text-lime-600',    badge: 'bg-lime-100 text-lime-700',       activeBorder: 'border-lime-400'    },
  orange:  { bg: 'bg-orange-50',  icon: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700',   activeBorder: 'border-orange-400'  },
  cyan:    { bg: 'bg-cyan-50',    icon: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700',       activeBorder: 'border-cyan-400'    },
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  badge: 'bg-violet-100 text-violet-700',   activeBorder: 'border-violet-400'  },
  pink:    { bg: 'bg-pink-50',    icon: 'text-pink-600',    badge: 'bg-pink-100 text-pink-700',       activeBorder: 'border-pink-400'    },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', activeBorder: 'border-emerald-400' },
  yellow:  { bg: 'bg-yellow-50',  icon: 'text-yellow-600',  badge: 'bg-yellow-100 text-yellow-700',   activeBorder: 'border-yellow-400'  },
  slate:   { bg: 'bg-slate-50',   icon: 'text-slate-600',   badge: 'bg-slate-100 text-slate-700',     activeBorder: 'border-slate-400'   },
  fuchsia: { bg: 'bg-fuchsia-50', icon: 'text-fuchsia-600', badge: 'bg-fuchsia-100 text-fuchsia-700', activeBorder: 'border-fuchsia-400' },
  indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700',   activeBorder: 'border-indigo-400'  },
  red:     { bg: 'bg-red-50',     icon: 'text-red-500',     badge: 'bg-red-100 text-red-700',         activeBorder: 'border-red-400'     },
};

const subscriptionBenefits = [
  '171+ готовых материалов',
  'Новые материалы каждую неделю',
  '15 запросов помощнику в месяц',
  '25% скидка на магазин',
  'Закрытый чат с автором в VK и Telegram',
];

export function SubscriptionMaterials({ onNavigate, hasSubscription = false, isAuthenticated = false }: SubscriptionMaterialsProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все категории');
  const catalogRef = useRef<HTMLDivElement>(null);

  const handlePreviewCardClick = (cardTitle: string) => {
    setCategory(cardTitle);
    setSearch('');
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const allSubscription = getMergedSubscriptionMaterials();
  const filtered = allSubscription.filter(doc => {
    const matchesSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase()) || doc.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Все категории' || doc.category === category;
    return matchesSearch && matchesCategory;
  });

  const activeCard = PREVIEW_CARDS.find(c => c.title === category);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Crown className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Материалы по подписке</h1>
          <p className="text-gray-600 mt-1">Материалы, доступные при активной подписке.</p>
          <p className="text-sm text-gray-500 mt-0.5">Ниже показаны материалы, доступные после оформления подписки.</p>
        </div>
      </div>

      {!hasSubscription ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Оформите подписку, чтобы открыть все материалы</h2>
          <p className="text-sm text-gray-600 mb-4">
            Подписка открывает большую библиотеку материалов, которая пополняется каждую неделю.
          </p>
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Что входит в подписку:</p>
            <ul className="space-y-2">
              {subscriptionBenefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button onClick={() => onNavigate('subscription')}>
              <Crown className="w-4 h-4" />
              Оформить подписку — 278 ₽/мес
            </Button>
            <button
              onClick={() => onNavigate('subscription-contents')}
              className="text-sm text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              Что входит в подписку
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
            <p className="text-xs text-gray-500">Можно отменить в любое время</p>
            <p className="text-xs text-gray-400">·</p>
            <p className="text-xs text-gray-500">Платформой уже пользуются педагоги из 1000+ городов</p>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">После оформления откроется доступ ко всем материалам</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Подписка активна — все материалы доступны для скачивания.</p>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Что входит в подписку</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Нажмите на раздел, чтобы перейти к его материалам ниже.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PREVIEW_CARDS.map((card) => {
            const Icon = card.icon;
            const colors = colorMap[card.color];
            const isActive = category === card.title;
            return (
              <button
                key={card.title}
                onClick={() => handlePreviewCardClick(card.title)}
                className={`bg-white border rounded-xl p-4 flex flex-col gap-2 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group ${
                  isActive
                    ? `border-2 ${colors.activeBorder} shadow-sm`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} transition-transform group-hover:scale-110`}>
                    <Icon className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {card.count} материалов
                  </span>
                </div>
                <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-900 group-hover:text-gray-700'}`}>
                  {card.title}
                </p>
                <ul className="space-y-1">
                  {card.examples.map((ex) => (
                    <li key={ex} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium transition-colors ${isActive ? colors.icon : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {isActive ? (
                    <>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.icon.replace('text-', 'bg-')}`} />
                      Показаны ниже
                    </>
                  ) : (
                    <>
                      Перейти к разделу
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                </div>
              </button>
            );
          })}
          <div className="bg-amber-50 border border-dashed border-amber-200 rounded-xl p-4 flex flex-col items-start justify-between gap-3 sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-amber-800">Список материалов постоянно пополняется — новые разделы и файлы добавляются каждую неделю.</p>
            <button
              onClick={() => onNavigate('subscription-contents')}
              className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
            >
              Посмотреть полный список разделов
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={catalogRef} className="scroll-mt-6">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-900">
              {category === 'Все категории' ? 'Все материалы' : category}
            </h2>
            {category !== 'Все категории' && (
              <button
                onClick={() => setCategory('Все категории')}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
              >
                Показать все
              </button>
            )}
          </div>
          {activeCard && category !== 'Все категории' && (
            <p className="text-sm text-gray-500">
              {activeCard.count} материалов в разделе
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Поиск по названию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-lg font-medium mb-1">Ничего не найдено</p>
            <p className="text-sm">Попробуйте изменить поисковый запрос или выбрать другую категорию</p>
            <button
              onClick={() => { setCategory('Все категории'); setSearch(''); }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((doc, index) => (
              <MaterialDocCard
                key={doc.id}
                doc={doc}
                hasSubscription={hasSubscription}
                isAuthenticated={isAuthenticated}
                onNavigate={onNavigate}
                popularityLabel={getPopularityLabel(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
