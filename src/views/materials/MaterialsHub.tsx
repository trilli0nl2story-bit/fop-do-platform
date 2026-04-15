import { useState } from 'react';
import { Gift, Crown, ShoppingBag, ChevronRight } from 'lucide-react';
import { InlineActivityBadge } from '../../components/InlineActivityBadge';

interface MaterialsHubProps {
  onNavigate: (page: string) => void;
  hasSubscription?: boolean;
  preselectedCategory?: string;
}

const AGE_FILTERS = [
  { label: 'Все', key: null },
  { label: '1–2 года', key: '1-2' },
  { label: '2–3 года', key: '2-3' },
  { label: '3–4 года', key: '3-4' },
  { label: '4–5 лет', key: '4-5' },
  { label: '5–6 лет', key: '5-6' },
  { label: '6–7 лет', key: '6-7' },
];

const CATEGORY_LABELS: Record<string, string> = {
  ktp: 'КТП',
  lesson: 'Занятие',
  diagnostics: 'Диагностика',
  games: 'Игры',
  parents: 'Родительское собрание',
  events: 'Досуги',
  pedsovety: 'Педагогические советы',
  program: 'Образовательная программа',
};

const sections = [
  {
    page: 'free-materials',
    icon: <Gift className="w-8 h-8" />,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    borderHover: 'hover:border-green-300',
    accentBar: 'bg-green-500',
    badge: 'Бесплатно',
    badgeClass: 'bg-green-100 text-green-700',
    startHere: true,
    title: 'Бесплатно',
    subtitle: 'Материалы, доступные бесплатно',
    description: 'Открывайте бесплатно, скачивание после быстрой регистрации.',
    count: '4 материала',
    cta: 'Открыть бесплатные материалы',
    ctaColor: 'text-green-600 group-hover:text-green-700',
  },
  {
    page: 'subscription-materials',
    icon: <Crown className="w-8 h-8" />,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderHover: 'hover:border-amber-300',
    accentBar: 'bg-amber-500',
    badge: 'По подписке',
    badgeClass: 'bg-amber-100 text-amber-700',
    startHere: false,
    title: 'По подписке',
    subtitle: 'Материалы, доступные по активной подписке',
    description: 'Библиотека пополняется каждую неделю. Доступна при наличии подписки.',
    count: '6 материалов',
    cta: 'Посмотреть библиотеку подписки',
    ctaColor: 'text-amber-600 group-hover:text-amber-700',
  },
  {
    page: 'store-materials',
    icon: <ShoppingBag className="w-8 h-8" />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
    accentBar: 'bg-blue-500',
    badge: 'Купить отдельно',
    badgeClass: 'bg-blue-100 text-blue-700',
    startHere: false,
    title: 'Магазин',
    subtitle: 'Документы, которые можно купить отдельно',
    description: 'Разовая покупка — документ остаётся у вас навсегда.',
    count: '6 документов',
    cta: 'Перейти к покупкам',
    ctaColor: 'text-blue-600 group-hover:text-blue-700',
  },
];

export function MaterialsHub({ onNavigate, preselectedCategory }: MaterialsHubProps) {
  const [selectedAge, setSelectedAge] = useState<string | null>(null);

  const categoryLabel = preselectedCategory ? CATEGORY_LABELS[preselectedCategory] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        {categoryLabel && (
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => onNavigate('landing')}
              className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
            >
              ← Назад
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-700">{categoryLabel}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {categoryLabel ? `Материалы: ${categoryLabel}` : 'Какой раздел хотите открыть?'}
        </h1>
        <p className="text-gray-600 mb-3">Выберите, как вы хотите получить доступ к материалам.</p>
        <InlineActivityBadge />
      </div>

      {categoryLabel && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Возраст (необязательно)</p>
          <div className="flex flex-wrap gap-2">
            {AGE_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setSelectedAge(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedAge === f.key
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-3">Выберите раздел, с которого хотите начать</p>
      <div className="space-y-4">
        {sections.map(s => (
          <button
            key={s.page}
            onClick={() => onNavigate(s.page)}
            className={`w-full text-left bg-white border-2 border-gray-200 ${s.borderHover} rounded-2xl p-5 sm:p-6 transition-all hover:shadow-md group relative overflow-hidden`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accentBar} rounded-l-2xl`} />
            <div className="flex items-start gap-5">
              <div className={`w-14 h-14 ${s.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {s.title}
                  </h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.badgeClass}`}>
                    {s.badge}
                  </span>
                  {s.startHere && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Начните здесь
                    </span>
                  )}
                </div>
                <p className="text-base font-medium text-gray-700 mb-1">{s.subtitle}</p>
                <p className="text-sm text-gray-500">{s.description}</p>
                <p className={`text-sm font-medium mt-2.5 flex items-center gap-1 ${s.ctaColor} transition-colors`}>
                  {s.cta} <ChevronRight className="w-3.5 h-3.5" />
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-1 transition-colors sm:block hidden" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Уже купили документ?{' '}
          <button
            onClick={() => onNavigate('my-documents')}
            className="text-blue-600 font-medium hover:underline"
          >
            Мои материалы
          </button>
          {' '}— все ваши документы в одном месте.
        </p>
      </div>
    </div>
  );
}
