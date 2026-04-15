import { useState } from 'react';
import { BookOpen, Brain, BarChart2, Dices, Users, CalendarDays, Lock, X, ArrowRight, Check, FileText, GraduationCap, Eye, Users as Users2 } from 'lucide-react';
import { useSocialProof } from '../hooks/useSocialProof';
import { HeroNotification } from './HeroNotification';
import { ContextHint } from './ContextHint';

interface ActionHeroProps {
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

const CATEGORIES = [
  {
    id: 'ktp',
    icon: <BookOpen className="w-7 h-7" />,
    label: 'КТП',
    sub: 'КТП на каждый день и неделю, темы недель',
    benefit: 'Готово за 10 минут',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    benefitColor: 'text-blue-500',
  },
  {
    id: 'lesson',
    icon: <Brain className="w-7 h-7" />,
    label: 'Занятие',
    sub: 'Конспекты занятий без подготовки',
    benefit: 'Можно использовать сразу',
    color: 'bg-teal-50 text-teal-600 border-teal-100',
    benefitColor: 'text-teal-500',
  },
  {
    id: 'diagnostics',
    icon: <BarChart2 className="w-7 h-7" />,
    label: 'Диагностика',
    sub: 'Готовые показатели и автоматизированные таблицы',
    benefit: 'Автоматический подсчёт',
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    benefitColor: 'text-sky-500',
  },
  {
    id: 'games',
    icon: <Dices className="w-7 h-7" />,
    label: 'Игры',
    sub: 'Игры и активности для детей',
    benefit: 'Без ручной подготовки',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    benefitColor: 'text-amber-500',
  },
  {
    id: 'parents',
    icon: <Users className="w-7 h-7" />,
    label: 'Родительское собрание',
    sub: 'Готовые сценарии и материалы',
    benefit: 'Полный сценарий под ключ',
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    benefitColor: 'text-rose-500',
  },
  {
    id: 'events',
    icon: <CalendarDays className="w-7 h-7" />,
    label: 'Досуги',
    sub: 'Праздники, квесты, квизы',
    benefit: 'Дети будут в восторге',
    color: 'bg-green-50 text-green-600 border-green-100',
    benefitColor: 'text-green-500',
  },
  {
    id: 'pedsovety',
    icon: <FileText className="w-7 h-7" />,
    label: 'Педагогические советы',
    sub: 'Готовые конспекты, презентации, раздаточный материал',
    benefit: 'Готово к показу',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    benefitColor: 'text-orange-500',
  },
  {
    id: 'program',
    icon: <GraduationCap className="w-7 h-7" />,
    label: 'Образовательная программа',
    sub: 'Программа, календарный план воспитательной работы, годовой план и др.',
    benefit: 'Соответствует ФОП ДО',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    benefitColor: 'text-cyan-500',
  },
];

const AGE_GROUPS = [
  { label: '1–2 года', sub: 'Ясельная группа', key: 'nursery' },
  { label: '2–3 года', sub: 'Первая младшая', key: 'junior1' },
  { label: '3–4 года', sub: 'Вторая младшая', key: 'junior2' },
  { label: '4–5 лет', sub: 'Средняя группа', key: 'middle' },
  { label: '5–6 лет', sub: 'Старшая группа', key: 'senior' },
  { label: '6–7 лет', sub: 'Подготовительная группа', key: 'prep' },
];

interface Material {
  title: string;
  preview: string;
  type: 'PDF' | 'DOCX';
  tags: string[];
}

const KTP_BY_AGE: Record<string, Material[]> = {
  nursery: [
    { title: 'КТП на неделю — Сенсорное развитие (ясельная группа)', preview: 'Понедельник: «Знакомство с цветом» — сенсорное развитие. Цель: научить детей различать красный, синий, жёлтый цвета, называть их. Использование цветных кубиков и шариков...\n\nВторник: «Мягкий и твёрдый» — тактильное восприятие. Цель: познакомить с контрастными свойствами предметов...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на месяц — Развитие речи (ясельная группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на год — Комплексный (ясельная группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП по ФЭМП — ясельная группа', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  junior1: [
    { title: 'КТП на неделю — Ознакомление с окружающим (первая младшая)', preview: 'Понедельник: «Кто живёт рядом с нами» — ознакомление с домашними животными. Цель: познакомить детей с котом, собакой, коровой, научить называть их детёнышей...\n\nВторник: «Большой и маленький» — развитие элементарных математических представлений. Цель: учить различать предметы по размеру...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на месяц — Речевое развитие (первая младшая)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на год — Комплексный (первая младшая)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП по ФЭМП — первая младшая группа', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  junior2: [
    { title: 'КТП на неделю — Познание (вторая младшая группа)', preview: 'Понедельник: «Осень в гости к нам пришла» — ознакомление с природой. Цель: формировать элементарные представления об осени, учить называть осенние признаки...\n\nВторник: «Один и много» — ФЭМП. Цель: учить детей понимать слова «один», «много», «ни одного»...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на месяц — Речевое развитие (вторая младшая)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на год — Комплексный (вторая младшая)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП по ФЭМП — вторая младшая группа', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  middle: [
    { title: 'КТП на неделю — Познание (средняя группа)', preview: 'Понедельник: «Наш город» — ознакомление с окружающим миром. Цель: формировать представления о родном городе, его достопримечательностях, учить находить на карте...\n\nВторник: «Счёт до пяти» — ФЭМП. Цель: учить считать до 5, соотносить цифру с количеством предметов...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на месяц — Речевое развитие (средняя группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на год — Комплексный (средняя группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП по ФЭМП — средняя группа', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  senior: [
    { title: 'КТП на неделю — Познание (старшая группа)', preview: 'Понедельник: «Путешествие в мир чисел» — формирование элементарных математических представлений. Цель: закрепить навыки счёта до 10, развивать логическое мышление...\n\nВторник: «Звуки вокруг нас» — ознакомление с окружающим миром. Цель: познакомить детей со свойствами звука, научить различать...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на месяц — Речевое развитие (старшая группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на год — Комплексный (старшая группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП по ФЭМП — старшая группа', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  prep: [
    { title: 'КТП на неделю — Познание (подготовительная группа)', preview: 'Понедельник: «Математика вокруг нас» — ФЭМП. Цель: закрепить навыки счёта в пределах 20, познакомить с составом числа, развивать логическое мышление...\n\nВторник: «Грамота: буква и звук» — обучение грамоте. Цель: закрепить знания о гласных и согласных, учить делить слова на слоги...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на месяц — Речевое развитие (подготовительная группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП на год — Комплексный (подготовительная группа)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'КТП по ФЭМП — подготовительная группа', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
};

const MATERIALS_PREVIEW: Record<string, Material[]> = {
  ktp: KTP_BY_AGE['senior'],
  lesson: [
    { title: 'Конспект занятия «Зима» — рисование', preview: 'Образовательная область: художественно-эстетическое развитие\nВозрастная группа: старшая (5–6 лет)\nЦель: создание выразительного образа зимнего пейзажа.\n\nХод занятия:\n1. Организационный момент (2 мин)\nВоспитатель: «Ребята, какое сейчас время года? Что изменилось вокруг нас зимой?»...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Конспект — «Весёлые числа» (4–5 лет)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Комплексное занятие по развитию речи', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Конспект — лепка «Снеговик»', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  diagnostics: [
    { title: 'Карта диагностики речевого развития', preview: 'Фамилия, имя ребёнка: _________________\nДата рождения: _______  Группа: _______\n\nПоказатель 1. Звукопроизношение\n□ Норма  □ Незначительные нарушения  □ Требует коррекции\n\nПоказатель 2. Словарный запас (активный)\n□ Соответствует возрасту  □ Ниже нормы  □ Значительно ниже нормы...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Диагностика по ФОП ДО — таблица', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Карта наблюдения за ребёнком (все области)', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Диагностический инструментарий (сентябрь)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  games: [
    { title: 'Дидактическая игра «Что лишнее?»', preview: 'Цель: развитие логического мышления, умения классифицировать предметы по признакам.\nВозраст: 4–6 лет\nОборудование: карточки с изображением 4 предметов (3 из одной группы, 1 лишний).\n\nХод игры:\nВоспитатель раскладывает перед ребёнком карточку. «Посмотри на картинки. Три предмета чем-то похожи, а один — лишний. Найди его и объясни почему»...', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Подвижная игра — «Воробьи и кот»', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Квест «В поисках клада» (5–6 лет)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Игровой сценарий «День рождения Мишки»', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  parents: [
    { title: 'Сценарий родительского собрания (сентябрь)', preview: 'Тема: «Начало нового учебного года. Задачи и планы»\nФорма проведения: традиционное собрание\nПродолжительность: 45–60 минут\n\nПовестка дня:\n1. Знакомство с новыми родителями (5 мин)\n2. Итоги прошлого учебного года (10 мин)\n3. Цели и задачи на текущий год...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Презентация — «Ребёнок и гаджеты»', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Собрание «Итоги года» — полный сценарий', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Протокол родительского собрания (шаблон)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  events: [
    { title: 'Сценарий праздника «Осенний бал»', preview: 'Действующие лица: Ведущий, Осень, Ветер, Листья (дети), Дождь.\n\nОформление зала: осенние листья, корзины с урожаем, жёлто-красные гирлянды.\n\nХод праздника:\nЗвучит лирическая осенняя музыка. Дети входят в зал.\nВедущий: «Здравствуйте, дорогие ребята и уважаемые гости! Сегодня мы собрались, чтобы проститься с золотой осенью»...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Квест «В поисках клада» (5–6 лет)', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Квиз «Знатоки природы»', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Сценарий «Новый год в детском саду»', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  pedsovety: [
    { title: 'Педсовет «Современные технологии в ДОУ»', preview: 'Форма проведения: деловая игра\nЦель: повышение профессиональной компетентности педагогов в области применения современных образовательных технологий.\n\nПовестка:\n1. Вступительное слово заведующего (5 мин)\n2. Теоретическая часть: «Технологии в соответствии с ФОП ДО» (15 мин)\n3. Деловая игра «Педагогическая копилка»...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Педсовет «Развитие речи дошкольников»', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Презентация к педсовету (шаблон)', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Раздаточный материал для педагогов', preview: '', type: 'PDF', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
  program: [
    { title: 'Образовательная программа ДОУ (ФОП ДО)', preview: 'Раздел 1. Целевой\n1.1. Пояснительная записка\nОбразовательная программа дошкольного образования разработана в соответствии с Федеральной образовательной программой дошкольного образования (Приказ Минпросвещения России от 25.11.2022 № 1028).\n\n1.2. Цели и задачи реализации программы\nЦель: разностороннее развитие ребёнка в период дошкольного детства...', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Календарный план воспитательной работы', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Годовой план работы ДОУ', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
    { title: 'Рабочая программа воспитателя', preview: '', type: 'DOCX', tags: ['готово к печати', 'соответствует ФОП ДО'] },
  ],
};

type Step = 'categories' | 'age' | 'materials' | 'preview';

export function ActionHero({ onNavigate, isAuthenticated = false }: ActionHeroProps) {
  const [step, setStep] = useState<Step>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgeKey, setSelectedAgeKey] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<Material | null>(null);
  const { count: downloadCount, animating, lastIncrement } = useSocialProof();

  const handleCategoryClick = (id: string) => {
    onNavigate('materials-hub/' + id);
  };

  const handleAgeClick = (ageKey: string) => {
    setSelectedAgeKey(ageKey);
    setStep('materials');
  };

  const handleBack = () => {
    if (step === 'age') { setStep('categories'); setSelectedCategory(null); setSelectedAgeKey(null); }
    if (step === 'materials') { setStep('age'); setSelectedAgeKey(null); }
    if (step === 'preview') { setStep('materials'); setPreviewItem(null); }
  };

  const handleFirstItemClick = () => {
    const items = selectedCategory ? MATERIALS_PREVIEW[selectedCategory] : [];
    if (items.length > 0) {
      setPreviewItem(items[0]);
      setStep('preview');
    }
  };

  const handleLockedClick = () => {
    if (isAuthenticated) {
      setShowSubscriptionModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const materials = selectedCategory
    ? (selectedCategory === 'ktp' && selectedAgeKey
        ? KTP_BY_AGE[selectedAgeKey] ?? MATERIALS_PREVIEW['ktp']
        : MATERIALS_PREVIEW[selectedCategory] ?? [])
    : [];
  const catLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label ?? '';

  return (
    <div className="pt-6 sm:pt-10 pb-8 text-center relative">

      {isAuthenticated && step === 'categories' && (
        <button
          onClick={() => onNavigate('materials-hub')}
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full mb-4 transition-colors shadow-sm"
        >
          Продолжить работу →
        </button>
      )}

      <h1 className="text-2xl sm:text-4xl lg:text-[48px] font-bold text-gray-900 mb-3 leading-[1.15] max-w-3xl mx-auto">
        Что вам нужно подготовить прямо сейчас?
      </h1>

      <p className="text-sm sm:text-base text-gray-500 mb-4 max-w-sm mx-auto leading-relaxed">
        Без готовых материалов подготовка занимает 3–5 часов.<br />
        Здесь — получите готовое за 10 минут.
      </p>

      {step === 'categories' && !isAuthenticated && (
        <button
          onClick={() => onNavigate('materials-hub')}
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm sm:text-base px-7 py-3.5 rounded-xl mb-4 transition-colors shadow-lg shadow-blue-500/25"
        >
          Получить материалы →
        </button>
      )}

      {step === 'categories' && (
        <div className="mb-5 space-y-2">
          <HeroNotification />
          <div className="inline-flex items-center gap-1.5 text-green-700 text-xs font-medium opacity-60">
            <Users2 className="w-3.5 h-3.5 flex-shrink-0" />
            {animating && lastIncrement > 1 ? (
              <span key={downloadCount} style={{ animation: 'socialPop 0.5s ease-out' }}>
                Только что скачали ещё {lastIncrement} педагога
              </span>
            ) : (
              <span>
                Сегодня уже используют:{' '}
                <span
                  key={downloadCount}
                  className="font-semibold"
                  style={animating ? { animation: 'socialPop 0.5s ease-out' } : undefined}
                >
                  {downloadCount}
                </span>{' '}
                педагогов
              </span>
            )}
          </div>
        </div>
      )}

      {step !== 'categories' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={handleBack}
            className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            ← Назад
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-400">
            {step === 'age' && `${catLabel} — выберите возраст`}
            {step === 'materials' && catLabel}
            {step === 'preview' && previewItem?.title}
          </span>
        </div>
      )}

      {/* CATEGORIES */}
      {step === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`group flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-150 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] shadow-sm ${cat.color}`}
            >
              <div className="flex items-center gap-3 w-full">
                <span className="flex-shrink-0">{cat.icon}</span>
                <span className="ml-auto w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shadow-sm group-hover:bg-white transition-colors flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-base text-gray-900 leading-tight">{cat.label}</p>
                  {cat.id === 'ktp' && (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">самый популярный</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{cat.sub}</p>
              </div>
              <span className={`text-xs font-semibold ${cat.benefitColor} bg-white/80 px-2.5 py-1 rounded-full`}>
                ✓ {cat.benefit}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* AGE */}
      {step === 'age' && (
        <div className="max-w-xl mx-auto mb-8">
          <p className="text-lg font-semibold text-gray-800 mb-1">Выберите возраст</p>
          <p className="text-sm text-gray-400 mb-5">Мы подобрали материалы под ваш возраст</p>
          <div className="flex flex-col gap-3">
            {AGE_GROUPS.map((ag) => (
              <button
                key={ag.label}
                onClick={() => handleAgeClick(ag.key)}
                className="flex items-center justify-between px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-base">{ag.label}</p>
                  <p className="text-sm text-gray-500">{ag.sub}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MATERIALS */}
      {step === 'materials' && (
        <div className="max-w-xl mx-auto mb-8 text-left">
          <div className="flex items-center justify-between mb-2">
            <p className="text-base text-gray-500">
              Найдено <span className="font-semibold text-gray-800">{materials.length} материала</span>
            </p>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <Users2 className="w-3.5 h-3.5" />
              {downloadCount} сегодня
            </div>
          </div>
          <ContextHint context={selectedCategory ?? 'default'} />
          <div className="mb-2" />
          <div className="flex flex-col gap-3 mb-2">
            <div
              onClick={handleFirstItemClick}
              className="flex items-start justify-between px-5 py-4 rounded-2xl border-2 border-blue-200 bg-blue-50 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="pr-4 flex-1">
                <p className="text-sm font-medium text-gray-800 leading-snug mb-2">{materials[0]?.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{materials[0]?.type}</span>
                  {materials[0]?.tags.map(tag => (
                    <span key={tag} className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
              <span className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-blue-600 bg-blue-100 group-hover:bg-blue-200 transition-all whitespace-nowrap mt-0.5">
                <Eye className="w-3.5 h-3.5" />
                Смотреть
              </span>
            </div>

            <div className="relative">
              <div className="flex flex-col gap-3">
                {materials.slice(1).map((item, i) => (
                  <div
                    key={i}
                    onClick={handleLockedClick}
                    className="flex items-start justify-between px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300 transition-all"
                  >
                    <div className="pr-4 flex-1">
                      <p className="text-sm font-medium text-gray-400 blur-[2px] leading-snug mb-2 select-none">{item.title}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded blur-[1px] select-none">{item.type}</span>
                        {item.tags.map(tag => (
                          <span key={tag} className="text-xs text-gray-300 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded blur-[1px] select-none">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent pointer-events-none rounded-b-2xl" />
            </div>
          </div>

          <div
            onClick={handleLockedClick}
            className="flex items-center justify-between px-5 py-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all mt-4"
          >
            <div>
              <p className="text-sm font-semibold text-blue-700">Откройте доступ ко всем материалам</p>
              <p className="text-xs text-blue-500 mt-0.5">Скачивайте без ограничений</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {step === 'preview' && previewItem && (
        <div className="max-w-xl mx-auto mb-8 text-left">
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800 leading-snug">{previewItem.title}</p>
              <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded flex-shrink-0">{previewItem.type}</span>
            </div>
            <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-gray-100">
              {previewItem.tags.map(tag => (
                <span key={tag} className="text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium">✓ {tag}</span>
              ))}
            </div>
            <div className="relative px-6 py-5">
              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                {previewItem.preview || 'Фрагмент материала доступен после регистрации.'}
              </pre>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
            <div className="px-6 py-5 bg-white border-t border-gray-100">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-center">
                <p className="text-sm font-semibold text-blue-800">Вы уже получили часть материала</p>
                <p className="text-xs text-blue-600 mt-0.5">Полная версия доступна сразу после доступа</p>
              </div>
              <button
                onClick={() => { isAuthenticated ? setShowSubscriptionModal(true) : onNavigate('register'); }}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Скачать полностью (2 минуты)
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => onNavigate('login')}
                  className="w-full mt-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Уже есть аккаунт? Войти
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Получить доступ к материалам</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Войдите или зарегистрируйтесь, чтобы скачивать материалы
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowAuthModal(false); onNavigate('register'); }}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
              >
                Зарегистрироваться
              </button>
              <button
                onClick={() => { setShowAuthModal(false); onNavigate('login'); }}
                className="w-full py-3.5 border-2 border-gray-200 hover:border-blue-300 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION MODAL */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-7 pb-2">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">Один шаг до материала</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">Вы почти получили материал</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Остался 1 шаг — откройте доступ и скачайте полностью</p>
            </div>

            <div className="mx-6 my-4 bg-gray-50 rounded-2xl px-4 py-3 grid grid-cols-2 gap-2">
              {[
                { icon: <Check className="w-3.5 h-3.5 text-green-500" />, text: 'Полная версия документа' },
                { icon: <Check className="w-3.5 h-3.5 text-green-500" />, text: 'Готово к печати' },
                { icon: <Check className="w-3.5 h-3.5 text-green-500" />, text: 'Соответствует ФОП ДО' },
                { icon: <Check className="w-3.5 h-3.5 text-green-500" />, text: 'Можно использовать сразу' },
              ].map(({ icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-xs text-gray-700">
                  {icon}
                  {text}
                </span>
              ))}
            </div>

            <div className="px-6 pb-6 flex flex-col gap-3">
              <div
                onClick={() => { setShowSubscriptionModal(false); onNavigate('subscription'); }}
                className="group cursor-pointer bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-2xl px-5 py-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm leading-tight">Получить доступ ко всем материалам</p>
                    <p className="text-blue-200 text-xs mt-0.5">2000+ материалов, обновления каждую неделю</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white flex-shrink-0 ml-3 transition-colors" />
                </div>
                <p className="text-xs text-blue-100 mt-2.5 font-medium">Менее 2 ₽ за документ</p>
                <button className="mt-3 w-full py-2.5 bg-white text-blue-600 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors">
                  Открыть доступ →
                </button>
              </div>

              <div
                onClick={() => { setShowSubscriptionModal(false); onNavigate('library'); }}
                className="group cursor-pointer border-2 border-gray-200 hover:border-gray-300 rounded-2xl px-5 py-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">Скачать только этот материал</p>
                    <p className="text-gray-400 text-xs mt-0.5">Разовая покупка</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 ml-3 transition-colors" />
                </div>
                <button className="mt-3 w-full py-2.5 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold rounded-xl text-sm transition-colors">
                  Скачать этот материал →
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Users2 className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-400">Уже используют более 1000 педагогов</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
