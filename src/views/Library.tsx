import { useState } from 'react';
import { Search, Filter, Eye, ShoppingCart, Check, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useCart, CartItem } from '../context/CartContext';

interface LibraryProps {
  isAuthenticated?: boolean;
  onNavigate?: (page: string) => void;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  PPT: 'bg-orange-50 text-orange-600'
};

type DevelopmentFeature = 'none' | 'tnr' | 'zpr' | 'ras' | 'onr';
type ProgramType = 'fop-do' | 'faop-do' | 'universal';
type EducationalArea = 'all' | 'social' | 'cognitive' | 'speech' | 'artistic' | 'physical';

const developmentFeatureLabels: Record<DevelopmentFeature, string> = {
  none: 'Без особенностей',
  tnr: 'ТНР',
  zpr: 'ЗПР',
  ras: 'РАС',
  onr: 'ОНР',
};

const programLabels: Record<ProgramType, string> = {
  'fop-do': 'ФОП ДО',
  'faop-do': 'ФАОП ДО',
  'universal': 'Универсальный',
};

const educationalAreaLabels: Record<EducationalArea, string> = {
  all: 'Все области',
  social: 'Социально-коммуникативное развитие',
  cognitive: 'Познавательное развитие',
  speech: 'Речевое развитие',
  artistic: 'Художественно-эстетическое развитие',
  physical: 'Физическое развитие',
};

const programColors: Record<ProgramType, string> = {
  'fop-do': 'bg-teal-50 text-teal-700',
  'faop-do': 'bg-sky-50 text-sky-700',
  'universal': 'bg-gray-100 text-gray-600',
};

const AGE_GROUPS = [
  '1–2 года',
  '2–3 года',
  '3–4 года',
  '4–5 лет',
  '5–6 лет',
  '6–7 лет',
  '1–3 года',
  '1–4 года',
  '2–4 года',
  '2–5 лет',
  '3–5 лет',
  '5–7 лет',
  '3–7 лет',
  '1–7 лет',
];

type LibraryDoc = CartItem & {
  ageGroup: string;
  description: string;
  date: string;
  views: number;
  downloads: number;
  program: ProgramType;
  developmentFeature: DevelopmentFeature;
  specialization?: string;
  educationalArea?: EducationalArea;
};

const sampleDocuments: LibraryDoc[] = [
  {
    id: 1,
    title: 'Конспект занятия "Осенние листья"',
    category: 'Планы занятий',
    ageGroup: '4–5 лет',
    description: 'Занятие по экологическому воспитанию с элементами творчества',
    date: '15 марта 2024',
    views: 234,
    downloads: 45,
    price: 149,
    fileType: 'PDF',
    program: 'fop-do',
    developmentFeature: 'none',
    educationalArea: 'cognitive',
  },
  {
    id: 2,
    title: 'Рабочая программа по ФОП ДО',
    category: 'Программы',
    ageGroup: '1–7 лет',
    description: 'Рабочая программа в соответствии с ФОП ДО на 2024 год',
    date: '14 марта 2024',
    views: 456,
    downloads: 89,
    price: 390,
    fileType: 'DOCX',
    program: 'fop-do',
    developmentFeature: 'none',
  },
  {
    id: 3,
    title: 'Методические рекомендации по организации развивающей среды',
    category: 'Рекомендации',
    ageGroup: '3–7 лет',
    description: 'Практические советы по созданию развивающей предметно-пространственной среды',
    date: '13 марта 2024',
    views: 189,
    downloads: 34,
    price: 220,
    fileType: 'DOCX',
    program: 'faop-do',
    developmentFeature: 'zpr',
    specialization: 'Психолог',
    educationalArea: 'social',
  },
  {
    id: 4,
    title: 'План занятия "В мире животных"',
    category: 'Планы занятий',
    ageGroup: '5–6 лет',
    description: 'Познавательное занятие о животных средней полосы России',
    date: '12 марта 2024',
    views: 312,
    downloads: 67,
    price: 149,
    fileType: 'PDF',
    program: 'fop-do',
    developmentFeature: 'none',
    educationalArea: 'cognitive',
  },
  {
    id: 5,
    title: 'Праздник "Новый год в детском саду"',
    category: 'Сценарии',
    ageGroup: '3–7 лет',
    description: 'Готовый сценарий новогоднего праздника с песнями и играми',
    date: '10 марта 2024',
    views: 520,
    downloads: 140,
    price: 290,
    fileType: 'PPT',
    program: 'universal',
    developmentFeature: 'none',
  },
  {
    id: 6,
    title: 'Диагностика речевого развития',
    category: 'Диагностика',
    ageGroup: '4–5 лет',
    description: 'Диагностические материалы и карты наблюдения',
    date: '9 марта 2024',
    views: 198,
    downloads: 55,
    price: 180,
    fileType: 'PDF',
    program: 'faop-do',
    developmentFeature: 'tnr',
    specialization: 'Логопед',
  },
  {
    id: 7,
    title: 'Индивидуальный маршрут для ребёнка с РАС',
    category: 'Рекомендации',
    ageGroup: '3–7 лет',
    description: 'Адаптированные материалы для работы с детьми с расстройствами аутистического спектра',
    date: '8 марта 2024',
    views: 143,
    downloads: 28,
    price: 260,
    fileType: 'DOCX',
    program: 'faop-do',
    developmentFeature: 'ras',
    specialization: 'Психолог',
    educationalArea: 'social',
  },
  {
    id: 8,
    title: 'Коррекционные упражнения при ОНР',
    category: 'Диагностика',
    ageGroup: '5–6 лет',
    description: 'Комплекс логопедических упражнений для детей с общим недоразвитием речи',
    date: '7 марта 2024',
    views: 167,
    downloads: 41,
    price: 199,
    fileType: 'PDF',
    program: 'faop-do',
    developmentFeature: 'onr',
    specialization: 'Логопед',
  },
  {
    id: 9,
    title: 'Сенсорные игры для малышей',
    category: 'Планы занятий',
    ageGroup: '1–3 года',
    description: 'Развивающие игры для детей раннего возраста, направленные на сенсорное развитие',
    date: '6 марта 2024',
    views: 211,
    downloads: 60,
    price: 129,
    fileType: 'PDF',
    program: 'fop-do',
    developmentFeature: 'none',
  },
  {
    id: 10,
    title: 'Адаптированная программа для детей с ЗПР',
    category: 'Программы',
    ageGroup: '5–7 лет',
    description: 'Полная адаптированная образовательная программа для дошкольников с ЗПР',
    date: '5 марта 2024',
    views: 302,
    downloads: 74,
    price: 450,
    fileType: 'DOCX',
    program: 'faop-do',
    developmentFeature: 'zpr',
    specialization: 'Дефектолог',
  },
];

const SPECIALIZATIONS = ['Логопед', 'Психолог', 'Дефектолог', 'Воспитатель'];

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pt-4 border-t border-gray-200 first:border-t-0 first:pt-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-2"
      >
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

export function Library({ isAuthenticated = true, onNavigate }: LibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState<ProgramType | 'all'>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedDevFeature, setSelectedDevFeature] = useState<DevelopmentFeature | 'all'>('all');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedEduArea, setSelectedEduArea] = useState<EducationalArea>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { addItem, items } = useCart();

  const categories = [
    { id: 'all', name: 'Все категории' },
    { id: 'plans', name: 'Планы занятий' },
    { id: 'programs', name: 'Программы' },
    { id: 'fop', name: 'ФОП ДО' },
    { id: 'recommendations', name: 'Рекомендации' },
    { id: 'diagnostics', name: 'Диагностика' },
    { id: 'scenarios', name: 'Сценарии' }
  ];

  const programOptions: { value: ProgramType | 'all'; label: string }[] = [
    { value: 'all', label: 'Все программы' },
    { value: 'fop-do', label: 'ФОП ДО' },
    { value: 'faop-do', label: 'ФАОП ДО' },
    { value: 'universal', label: 'Универсальный' },
  ];

  const developmentFeatureOptions: { value: DevelopmentFeature | 'all'; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'none', label: 'Без особенностей' },
    { value: 'tnr', label: 'ТНР' },
    { value: 'zpr', label: 'ЗПР' },
    { value: 'ras', label: 'РАС' },
    { value: 'onr', label: 'ОНР' },
  ];

  const recommended = [
    { title: 'Новые требования ФОП ДО', category: 'ФОП ДО' },
    { title: 'Весенние занятия', category: 'Планы занятий' },
    { title: 'Развивающие игры', category: 'Методички' }
  ];

  const filtered = sampleDocuments.filter(doc => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'plans' && doc.category === 'Планы занятий') ||
      (selectedCategory === 'programs' && doc.category === 'Программы') ||
      (selectedCategory === 'fop' && doc.program === 'fop-do') ||
      (selectedCategory === 'recommendations' && doc.category === 'Рекомендации') ||
      (selectedCategory === 'diagnostics' && doc.category === 'Диагностика') ||
      (selectedCategory === 'scenarios' && doc.category === 'Сценарии');
    const matchesProgram = selectedProgram === 'all' || doc.program === selectedProgram;
    const matchesAge = selectedAge === 'all' || doc.ageGroup === selectedAge;
    const matchesDevFeature = selectedDevFeature === 'all' || doc.developmentFeature === selectedDevFeature;
    const matchesSpecialization =
      selectedSpecialization === 'all' ||
      (selectedSpecialization === 'Воспитатель' && !doc.specialization) ||
      doc.specialization === selectedSpecialization;
    const matchesEduArea =
      selectedEduArea === 'all' ||
      doc.educationalArea === selectedEduArea;
    return matchesSearch && matchesCategory && matchesProgram && matchesAge && matchesDevFeature && matchesSpecialization && matchesEduArea;
  });

  const isInCart = (id: number) => items.some(i => i.id === id);

  const handleAddToCart = (doc: LibraryDoc) => {
    if (!isAuthenticated && onNavigate) {
      onNavigate('register');
      return;
    }
    addItem({ id: doc.id, title: doc.title, category: doc.category, price: doc.price, fileType: doc.fileType });
  };

  const filterButtonClass = (active: boolean) =>
    `w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
      active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Библиотека документов</h1>
        <p className="text-gray-600">Найдите нужные методические материалы</p>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Поиск по названию, теме или ключевым словам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <Button
            variant="secondary"
            className="sm:w-auto lg:hidden"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            {mobileFiltersOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
            Фильтры
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-1 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          <Card hover={false} className="sticky top-20 space-y-4">
            <FilterSection title="Категория" defaultOpen={true}>
              <div className="space-y-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={filterButtonClass(selectedCategory === cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Образовательные области" defaultOpen={false}>
              <div className="space-y-0.5">
                {(Object.keys(educationalAreaLabels) as EducationalArea[]).map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedEduArea(area)}
                    className={filterButtonClass(selectedEduArea === area)}
                  >
                    {educationalAreaLabels[area]}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Программа" defaultOpen={true}>
              <div className="space-y-0.5">
                {programOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedProgram(opt.value)}
                    className={filterButtonClass(selectedProgram === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Возраст" defaultOpen={false}>
              <div className="space-y-0.5">
                <button
                  onClick={() => setSelectedAge('all')}
                  className={filterButtonClass(selectedAge === 'all')}
                >
                  Любой возраст
                </button>
                {AGE_GROUPS.map((age) => (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className={filterButtonClass(selectedAge === age)}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Особенности развития" defaultOpen={false}>
              <div className="space-y-0.5">
                {developmentFeatureOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDevFeature(opt.value)}
                    className={filterButtonClass(selectedDevFeature === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Специализация" defaultOpen={false}>
              <div className="space-y-0.5">
                <button
                  onClick={() => setSelectedSpecialization('all')}
                  className={filterButtonClass(selectedSpecialization === 'all')}
                >
                  Все специалисты
                </button>
                {SPECIALIZATIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSpecialization(s)}
                    className={filterButtonClass(selectedSpecialization === s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FilterSection>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Рекомендуемое</h3>
              <div className="space-y-3">
                {recommended.map((item, index) => (
                  <div key={index} className="text-sm cursor-pointer hover:text-blue-600 transition-colors">
                    <p className="text-gray-900 font-medium leading-snug">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.category}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium mb-1">Ничего не найдено</p>
              <p className="text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((doc) => (
                <Card key={doc.id} className="hover:border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="w-11 h-11 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer leading-snug">
                            {doc.title}
                          </h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${fileTypeColors[doc.fileType]}`}>
                            {doc.fileType}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2.5 leading-relaxed">{doc.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            {doc.category}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${programColors[doc.program]}`}>
                            {programLabels[doc.program]}
                          </span>
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            Возраст: {doc.ageGroup}
                          </span>
                          {doc.developmentFeature !== 'none' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                              {developmentFeatureLabels[doc.developmentFeature]}
                            </span>
                          )}
                          {doc.specialization && (
                            <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full text-xs border border-gray-200">
                              {doc.specialization}
                            </span>
                          )}
                          {doc.educationalArea && doc.educationalArea !== 'all' && (
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                              {educationalAreaLabels[doc.educationalArea]}
                            </span>
                          )}
                          <span className="text-gray-400 text-xs">{doc.views} просмотров</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
                      <span className="text-xl font-bold text-gray-900">{doc.price} ₽</span>
                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <Button size="sm" variant="secondary" className="flex-1 sm:flex-none">
                          <Eye className="w-4 h-4" />
                          <span className="sm:inline">Просмотр</span>
                        </Button>
                        <Button
                          size="sm"
                          className={`flex-1 sm:flex-none ${isInCart(doc.id) ? 'bg-green-500 hover:bg-green-600' : ''}`}
                          onClick={() => handleAddToCart(doc)}
                        >
                          {isInCart(doc.id) ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="sm:inline">В корзине</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span className="sm:inline">В корзину</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
