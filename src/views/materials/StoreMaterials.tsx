import { useEffect, useState } from 'react';
import { Search, ShoppingBag, Eye, ShoppingCart, Check, FileText, Zap, Gift, Clock, TrendingUp } from 'lucide-react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { KTP_MONTHS, KTP_AGE_GROUPS, StoreProduct } from '../../data/storeProducts';
import { getMergedStoreProducts } from '../../lib/cmsProducts';
import { dbMaterialToStoreProduct } from '../../lib/dbStoreProducts';
import { getVisibleCategories } from '../../lib/cmsCategories';
import { useCart } from '../../context/CartContext';
import { usePostPurchaseDiscount } from '../../context/PostPurchaseDiscountContext';
import { getPopularityLabel } from '../../data/notifications';

interface StoreMaterialsProps {
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  PPT: 'bg-orange-50 text-orange-600',
  PPTX: 'bg-orange-50 text-orange-600',
};

const USE_CASES = [
  { label: 'КТП', keywords: ['кт', 'кт п', 'комплексно-тематическое'], categories: ['КТП на каждый день', 'КТП по неделям', 'КТП на весь учебный год'] },
  { label: 'Рабочую программу', keywords: ['рабочая программа', 'рабочую программу'], categories: ['Рабочие программы', 'ОП ДО / ФОП ДО'] },
  { label: 'Квест', keywords: ['квест', 'квиз', 'досуг', 'сценарий'], categories: ['Квесты и досуги', 'Сценарии'] },
  { label: 'Диагностику', keywords: ['диагностик'], categories: ['Диагностика'] },
  { label: 'План', keywords: ['план'], categories: ['Планы и документация'] },
  { label: 'Родительское собрание', keywords: ['родительское собрание', 'педсовет', 'семинар'], categories: ['Планы и документация'] },
];

function getPurposeLabel(product: StoreProduct): string {
  const cat = product.category;
  if (cat.includes('КТП')) return 'Для ежедневного планирования и отчётности';
  if (cat === 'Рабочие программы' || cat === 'ОП ДО / ФОП ДО') return 'Для годового планирования и отчётности';
  if (cat === 'Диагностика') return 'Для оценки развития детей';
  if (cat === 'Квесты и досуги' || cat === 'Сценарии') return 'Для проведения мероприятий с детьми';
  if (cat === 'Планы и документация') return 'Для организации работы и отчётности';
  if (cat === 'Проекты') return 'Для проектной деятельности с детьми';
  if (cat === 'Вебинары и уроки') return 'Для профессионального развития педагога';
  if (cat === 'ФАОП / ТНР' || cat === 'Специалисты') return 'Для работы со специалистами и коррекционной группой';
  return 'Для работы воспитателя';
}

function getContentHint(product: StoreProduct): string {
  if (product.whatIsIncluded && product.whatIsIncluded.length > 0) {
    const items = product.whatIsIncluded.slice(0, 3).join(', ');
    return `Содержит: ${items}`;
  }
  const cat = product.category;
  if (cat.includes('КТП на каждый день')) return 'Содержит: план на каждый день, конспекты, прогулки';
  if (cat.includes('КТП по неделям')) return 'Содержит: понедельный план, темы, задачи по областям';
  if (cat.includes('КТП на весь учебный год')) return 'Содержит: годовое планирование, все образовательные области';
  if (cat === 'Диагностика') return 'Содержит: карты наблюдений, критерии оценки, таблицы';
  if (cat === 'Рабочие программы') return 'Содержит: программа, пояснительная записка, планирование';
  return 'Содержит: готовые материалы для применения';
}

function ProductCoverThumb({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <FileText className="w-5 h-5 text-gray-500" />;
  }

  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function StoreProductCard({
  product,
  isInCart,
  onAddToCart,
  onNavigate,
  popularityLabel,
}: {
  product: StoreProduct;
  isInCart: boolean;
  onAddToCart: (p: StoreProduct) => void;
  onNavigate: (page: string) => void;
  popularityLabel?: string | null;
}) {
  const purposeLabel = getPurposeLabel(product);
  const contentHint = getContentHint(product);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="w-11 h-11 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <ProductCoverThumb src={product.coverUrl} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <button
                onClick={() => onNavigate(`store/${product.slug}`)}
                className="text-left"
              >
                <h3 className="text-base font-semibold text-gray-900 leading-snug hover:text-blue-600 transition-colors">
                  {product.title}
                </h3>
              </button>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${fileTypeColors[product.fileType]}`}>
                {product.fileType}
              </span>
              {popularityLabel && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 flex-shrink-0">
                  <TrendingUp className="w-3 h-3" />
                  {popularityLabel}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
              <span className="text-xs text-gray-500 font-medium">
                Возраст: <span className="text-gray-700">{product.ageGroup}</span>
              </span>
              <span className="text-gray-300 hidden sm:inline">·</span>
              <span className="text-xs text-gray-500">{purposeLabel}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">{contentHint}</p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                {product.category}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.programColor}`}>
                {product.program}
              </span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
          <span className="text-xl font-bold text-gray-900">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          <div className="flex sm:flex-col gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={() => onNavigate(`store/${product.slug}`)}
            >
              <Eye className="w-4 h-4" />
              Просмотр
            </Button>
            <Button
              size="sm"
              className={`flex-1 sm:flex-none ${isInCart ? 'bg-green-500 hover:bg-green-600' : ''}`}
              onClick={() => onAddToCart(product)}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4" />
                  В корзине
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  В корзину
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KtpSubFilters({
  ktpMonth,
  ktpAge,
  onMonthChange,
  onAgeChange,
}: {
  ktpMonth: string;
  ktpAge: string;
  onMonthChange: (v: string) => void;
  onAgeChange: (v: string) => void;
}) {
  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Уточнить выборку</p>
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Месяц</p>
        <div className="flex flex-wrap gap-1.5">
          {KTP_MONTHS.map(m => (
            <button
              key={m}
              onClick={() => onMonthChange(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                ktpMonth === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Возрастная группа</p>
        <div className="flex flex-wrap gap-1.5">
          {KTP_AGE_GROUPS.map(a => (
            <button
              key={a}
              onClick={() => onAgeChange(a)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                ktpAge === a
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatHoursRemaining(expiresAt: Date): string {
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

export function StoreMaterials({ onNavigate, isAuthenticated = true }: StoreMaterialsProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все категории');
  const [ktpMonth, setKtpMonth] = useState('Все месяцы');
  const [ktpAge, setKtpAge] = useState('Все возраста');
  const [activeUseCase, setActiveUseCase] = useState<string | null>(null);
  const [dbProducts, setDbProducts] = useState<StoreProduct[]>([]);
  const { addItem, items } = useCart();
  const { discount, hoursRemaining } = usePostPurchaseDiscount();
  const hasActiveDiscount = discount && !discount.used;
  const isExpiringSoon = hoursRemaining !== null && hoursRemaining <= 6;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setActiveUseCase(null);
    if (cat !== 'КТП на каждый день') {
      setKtpMonth('Все месяцы');
      setKtpAge('Все возраста');
    }
  };

  const handleUseCaseClick = (useCase: typeof USE_CASES[0]) => {
    if (activeUseCase === useCase.label) {
      setActiveUseCase(null);
      setCategory('Все категории');
      setKtpMonth('Все месяцы');
      setKtpAge('Все возраста');
    } else {
      setActiveUseCase(useCase.label);
      setCategory('Все категории');
      setKtpMonth('Все месяцы');
      setKtpAge('Все возраста');
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/materials/store')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled) return;
        const products = Array.isArray(data?.materials)
          ? data.materials.map(dbMaterialToStoreProduct)
          : [];
        setDbProducts(products);
      })
      .catch(() => {
        if (!cancelled) setDbProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const localProducts = getMergedStoreProducts();
  const localSlugs = new Set(localProducts.map(product => product.slug));
  const allProducts = [
    ...dbProducts.filter(product => !localSlugs.has(product.slug)),
    ...localProducts,
  ];
  const categoryNames = new Set([
    ...getVisibleCategories().map(c => c.name),
    ...dbProducts.map(product => product.category).filter(Boolean),
  ]);
  const visibleCategoryNames = ['Все категории', ...Array.from(categoryNames)];

  const filtered = allProducts.filter(p => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(search.toLowerCase());

    let matchesCategory = category === 'Все категории' || p.category === category;

    if (activeUseCase) {
      const uc = USE_CASES.find(u => u.label === activeUseCase);
      if (uc) {
        matchesCategory = uc.categories.includes(p.category);
      }
    }

    if (!matchesSearch || !matchesCategory) return false;

    if (category === 'КТП на каждый день') {
      const matchesMonth = ktpMonth === 'Все месяцы' || p.ktpMonth === ktpMonth;
      const matchesAge = ktpAge === 'Все возраста' || p.ktpAgeKey === ktpAge;
      return matchesMonth && matchesAge;
    }

    return true;
  });

  const isInCart = (id: number) => items.some(i => i.id === id);

  const handleAddToCart = (product: StoreProduct) => {
    if (!isAuthenticated) {
      onNavigate('register');
      return;
    }
    if (!isInCart(product.id)) {
      addItem({
        id: product.id,
        slug: product.slug,
        materialId: product.materialId,
        title: product.title,
        category: product.category,
        price: product.price,
        fileType: product.fileType,
      });
    }
  };

  const count = filtered.length;
  const countLabel = count === 1 ? 'материал' : count >= 2 && count <= 4 ? 'материала' : 'материалов';

  const showKtpSubFilters = category === 'КТП на каждый день';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Магазин документов</h1>
          <p className="text-gray-600 mt-1">Документы и комплекты, которые можно купить отдельно.</p>
        </div>
      </div>

      {hasActiveDiscount && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 mb-5 ${isExpiringSoon ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
          <div className="flex items-center gap-2.5">
            <Gift className={`w-5 h-5 flex-shrink-0 ${isExpiringSoon ? 'text-red-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-sm font-semibold ${isExpiringSoon ? 'text-red-900' : 'text-amber-900'}`}>
                Для вас действует скидка −{discount!.discountAmount} ₽ на один следующий материал
              </p>
              <div className={`flex items-center gap-1 text-xs mt-0.5 ${isExpiringSoon ? 'text-red-700 font-semibold' : 'text-amber-700'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Скидка сгорит через {formatHoursRemaining(discount!.expiresAt)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('cart')}
            className={`text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
              isExpiringSoon
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            В корзину
          </button>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">Что вы ищете?</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {USE_CASES.map(uc => (
            <button
              key={uc.label}
              onClick={() => handleUseCaseClick(uc)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                activeUseCase === uc.label
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800'
              }`}
            >
              {uc.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
        <p className="text-sm text-blue-800">
          Разовая покупка — документ остаётся у вас навсегда. Подписка не нужна.
          {!isAuthenticated && (
            <>
              {' '}
              <button className="underline font-medium" onClick={() => onNavigate('register')}>
                Зарегистрируйтесь
              </button>
              , чтобы совершить покупку.
            </>
          )}
        </p>
      </div>

      <div className="mb-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Поиск по названию, теме, возрасту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleCategoryNames.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                category === cat && !activeUseCase
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {showKtpSubFilters && (
          <KtpSubFilters
            ktpMonth={ktpMonth}
            ktpAge={ktpAge}
            onMonthChange={setKtpMonth}
            onAgeChange={setKtpAge}
          />
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {count === 0 ? 'Ничего не найдено' : `${count} ${countLabel}`}
        </p>
        {(activeUseCase || showKtpSubFilters && (ktpMonth !== 'Все месяцы' || ktpAge !== 'Все возраста')) && (
          <button
            onClick={() => {
              setActiveUseCase(null);
              setKtpMonth('Все месяцы');
              setKtpAge('Все возраста');
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Сбросить
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-1">Ничего не найдено</p>
          <p className="text-sm">Попробуйте изменить поисковый запрос или выбрать другую категорию</p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('Все категории');
              setKtpMonth('Все месяцы');
              setKtpAge('Все возраста');
              setActiveUseCase(null);
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Сбросить все фильтры
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((product, index) => (
            <StoreProductCard
              key={product.id}
              product={product}
              isInCart={isInCart(product.id)}
              onAddToCart={handleAddToCart}
              onNavigate={onNavigate}
              popularityLabel={getPopularityLabel(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
