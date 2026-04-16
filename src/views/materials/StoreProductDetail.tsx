import { useEffect, useState } from 'react';
import {
  ArrowLeft, ShoppingCart, Eye, FileText, Check, Tag, Users, BookOpen,
  ChevronRight, ChevronDown, X, Image as ImageIcon, Lock, Sparkles,
  GraduationCap, ListChecks, Wrench, Plus, CalendarDays, PackageCheck, Star, Zap,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { getRelatedProducts, RelatedProduct, StoreProduct } from '../../data/storeProducts';
import { getMergedProductBySlug } from '../../lib/cmsProducts';
import { dbMaterialToStoreProduct } from '../../lib/dbStoreProducts';
import { useCart } from '../../context/CartContext';
import { InlineActivityHint } from '../../components/InlineActivityHint';
import { randomDownloadCount } from '../../data/notifications';

export const productPageTemplate = true;

interface StoreProductDetailProps {
  slug: string;
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600 border-red-100',
  DOCX: 'bg-blue-50 text-blue-600 border-blue-100',
  PPT: 'bg-orange-50 text-orange-600 border-orange-100',
  PPTX: 'bg-orange-50 text-orange-600 border-orange-100',
};

function ProductPreviewImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <>
        <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center mb-3">
          <ImageIcon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500 mb-1">Обложка и предпросмотр</p>
        <p className="text-xs text-gray-400 max-w-xs">Посмотрите часть документа перед покупкой</p>
      </>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function getForWhom(product: StoreProduct): string[] {
  const cat = product.category;
  if (cat.includes('КТП')) return ['воспитателям дошкольных групп', 'методистам ДОО', `группе ${product.ageGroup}`];
  if (cat === 'Рабочие программы' || cat === 'ОП ДО / ФОП ДО') return ['воспитателям', 'старшим воспитателям', 'методистам'];
  if (cat === 'Диагностика') return ['воспитателям', 'педагогам-психологам', 'методистам'];
  if (cat === 'Квесты и досуги' || cat === 'Сценарии') return ['воспитателям', 'музыкальным руководителям', `детям ${product.ageGroup}`];
  if (cat === 'Планы и документация') return ['воспитателям', 'методистам', 'администрации ДОО'];
  if (cat === 'ФАОП / ТНР' || cat === 'Специалисты') return ['учителям-логопедам', 'дефектологам', 'коррекционным педагогам'];
  return ['воспитателям', 'педагогам ДОО'];
}

function getWhatYouGet(product: StoreProduct): string[] {
  const cat = product.category;
  if (cat.includes('КТП на каждый день')) return ['готовый план на каждый день', 'не нужно тратить время на подготовку', 'можно использовать сразу в работе'];
  if (cat.includes('КТП по неделям')) return ['понедельное планирование на год', 'готово к печати и сдаче', 'соответствует ФОП ДО'];
  if (cat.includes('КТП на весь учебный год')) return ['полное годовое КТП', 'все образовательные области', 'соответствует ФОП ДО'];
  if (cat === 'Рабочие программы' || cat === 'ОП ДО / ФОП ДО') return ['готовую рабочую программу', 'можно адаптировать под группу', 'соответствует требованиям ФГОС'];
  if (cat === 'Диагностика') return ['инструмент оценки развития', 'готовые бланки и критерии', 'удобный формат для заполнения'];
  if (cat === 'Квесты и досуги' || cat === 'Сценарии') return ['готовый сценарий мероприятия', 'можно провести сразу', 'всё необходимое в одном файле'];
  if (cat === 'Планы и документация') return ['готовый документ', 'можно использовать сразу', 'соответствует требованиям'];
  return ['готовый документ', 'можно использовать сразу', 'без доработки'];
}

function PreviewModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{title} — Предпросмотр</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl aspect-[3/4] max-h-64 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">Обложка документа</p>
            <p className="text-xs text-gray-400 mt-1">Здесь будет отображаться обложка материала</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg aspect-[3/4] flex flex-col items-center justify-center text-center p-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400">Страница {i}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Предпросмотр ограничен</p>
              <p className="text-xs text-amber-700 mt-0.5">Полный доступ открывается после покупки. Документ останется у вас навсегда.</p>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {icon}
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4 space-y-1.5">{children}</div>}
    </div>
  );
}

export function StoreProductDetail({ slug, onNavigate, isAuthenticated = true }: StoreProductDetailProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [subscriptionActivated, setSubscriptionActivated] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dbProduct, setDbProduct] = useState<StoreProduct | null>(null);
  const [dbProductLoading, setDbProductLoading] = useState(false);
  const [downloadCount] = useState(() => randomDownloadCount());

  const localProduct = getMergedProductBySlug(slug);
  const product = localProduct ?? dbProduct;
  const { addItem, items } = useCart();
  const relatedProducts: RelatedProduct[] = product ? getRelatedProducts(product) : [];

  useEffect(() => {
    if (localProduct) return;
    let cancelled = false;
    setDbProductLoading(true);

    fetch(`/api/materials/store/${encodeURIComponent(slug)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled) return;
        setDbProduct(data?.material ? dbMaterialToStoreProduct(data.material) : null);
      })
      .catch(() => {
        if (!cancelled) setDbProduct(null);
      })
      .finally(() => {
        if (!cancelled) setDbProductLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [localProduct, slug]);

  const handleAddUpsell = (rp: RelatedProduct['product']) => {
    addItem({ id: rp.id, title: rp.title, category: rp.category, price: rp.price, fileType: rp.fileType });
    setAddedItems(prev => new Set(prev).add(rp.id));
  };

  if (!product && dbProductLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-500 text-lg">Загрузка материала...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-500 text-lg mb-4">Материал не найден</p>
        <Button onClick={() => onNavigate('store-materials')}>
          <ArrowLeft className="w-4 h-4" />Вернуться в магазин
        </Button>
      </div>
    );
  }

  const isInCart = items.some(i => i.id === product.id);

  const handleAddToCart = () => {
    if (!isAuthenticated) { onNavigate('register'); return; }
    if (!isInCart) addItem({ id: product.id, title: product.title, category: product.category, price: product.price, fileType: product.fileType });
  };

  const forWhom = getForWhom(product);
  const whatYouGet = getWhatYouGet(product);

  const docContext = (() => {
    const cat = product.category;
    if (cat.includes('КТП')) return 'ktp';
    if (cat === 'Диагностика') return 'diagnostics';
    if (cat === 'Квесты и досуги' || cat === 'Сценарии') return 'games';
    if (cat === 'Планы и документация') return 'parents';
    if (cat === 'Рабочие программы' || cat === 'ОП ДО / ФОП ДО') return 'program';
    return 'default';
  })();

  const ctaHints = (() => {
    const base = `${downloadCount} скачиваний сегодня · используют в 1000+ ДОУ`;
    if (docContext === 'ktp') return [base, 'Уже используют педагоги по всей России', 'Только что скачали: КТП на месяц'];
    if (docContext === 'diagnostics') return [base, 'Уже используют педагоги по всей России', 'Только что скачали: диагностику'];
    if (docContext === 'games') return [base, 'Уже используют педагоги по всей России', 'Только что скачали: квест'];
    return [base, 'Уже используют педагоги по всей России', 'Только что скачали этот материал'];
  })();

  const discountedPrice = Math.round(product.price * 0.75);
  const saving = product.price - discountedPrice;

  const keyBenefits = product.category === 'КТП на каждый день'
    ? ['Готовый месяц работы', 'Используйте сразу', 'Соответствует ФОП ДО']
    : ['Готово к работе', 'Без доработки', 'Для ДОУ'];

  const shortBenefit = product.category === 'КТП на каждый день'
    ? 'Готовый план на каждый день без подготовки'
    : 'Готовый материал — используйте сразу в работе';

  const whatIsIncludedKtp = (
    <ul className="space-y-2">
      <li className="flex items-start gap-2.5">
        <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-800">Деятельности на каждый день</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">дидактические и подвижные игры, беседы, сюжетно-ролевые игры, занятия, гимнастика, прогулки и др.</p>
        </div>
      </li>
      <li className="flex items-start gap-2.5">
        <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700">Приложения к плану</p>
      </li>
    </ul>
  );

  return (
    <>
      {showPreview && <PreviewModal title={product.title} onClose={() => setShowPreview(false)} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => onNavigate('store-materials')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Магазин документов
        </button>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── MAIN COLUMN ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Title block */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${fileTypeColors[product.fileType]}`}>{product.fileType}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.programColor}`}>{product.program}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">{product.category}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-1.5">{product.title}</h1>
              <p className="text-sm font-medium text-gray-500 mb-2.5">Не тратьте вечера на подготовку занятий — всё уже готово</p>
              <p className="text-base font-semibold text-blue-700 mb-2.5">{shortBenefit}</p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {keyBenefits.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                    <Check className="w-3 h-3" />{b}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" />{product.ageGroup}</span>
                <span className="inline-flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{product.program}</span>
              </div>
            </div>

            {/* ── MOBILE PRIMARY LAYER ── */}
            <div className="lg:hidden space-y-3">

              {/* Price */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-xl px-4 py-3 border border-blue-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{product.price.toLocaleString('ru-RU')}</span>
                  <span className="text-lg font-medium text-gray-600">₽</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Разовая покупка — навсегда ваше</p>
              </div>

              {/* Primary CTA */}
              <Button
                className={`w-full justify-center text-base py-3 ${isInCart ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={handleAddToCart}
              >
                {isInCart ? <><Check className="w-4 h-4" />В корзине</> : <><ShoppingCart className="w-4 h-4" />Купить и скачать сразу</>}
              </Button>

              {!isInCart && (
                <p className="text-center text-xs text-gray-400 -mt-1">
                  Скачаете через 10 секунд после оплаты · без лишних шагов
                </p>
              )}

              {isInCart && (
                <Button variant="secondary" className="w-full justify-center border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => onNavigate('cart')}>
                  Перейти в корзину
                </Button>
              )}

              {/* Secondary CTA */}
              {!isInCart && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />Посмотреть перед покупкой
                </button>
              )}

              {/* Social proof line */}
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                <span className="text-sm font-medium text-gray-700 flex-1 overflow-hidden">
                  <InlineActivityHint messages={ctaHints} intervalMs={20000} intervalJitterMs={10000} />
                </span>
              </div>

              {/* Subscription block */}
              {!subscriptionActivated ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-snug">Больше материалов по подписке</p>
                      <p className="text-xs text-gray-600 mt-0.5">Библиотека + помощник + скидка 25% на покупки в магазине</p>
                    </div>
                  </div>
                  <div className="bg-amber-100 rounded-lg px-2.5 py-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">1 документ сейчас:</span>
                      <span className="font-medium text-gray-700">{product.price.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">С подпиской:</span>
                      <span className="font-semibold text-amber-900">{discountedPrice.toLocaleString('ru-RU')} ₽ за документ</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-amber-200 pt-1 mt-0.5">
                      <span className="text-green-700 font-medium">Экономия:</span>
                      <span className="font-bold text-green-700">{saving.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 px-0.5">
                    <span className="text-gray-500">Подписка:</span>
                    <span className="font-bold text-amber-800">278 ₽/мес</span>
                  </div>
                  <button
                    onClick={() => setSubscriptionActivated(true)}
                    className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-3 py-2 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />Получить доступ за 278 ₽/мес
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">Подписка оформлена</p>
                    <p className="text-xs text-green-600">Библиотека открыта + скидка 25% на магазин</p>
                  </div>
                </div>
              )}

              {/* ── EXPANDABLE DETAILS SECTION ── */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setDetailsOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800">Показать подробности</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${detailsOpen ? 'rotate-180' : ''}`} />
                </button>

                {detailsOpen && (
                  <div className="px-4 bg-white divide-y divide-gray-100">
                    <Accordion title="Кому подходит" icon={<GraduationCap className="w-4 h-4 text-gray-500" />}>
                      {forWhom.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />{item}
                        </div>
                      ))}
                    </Accordion>

                    {(product.category === 'КТП на каждый день' || (product.whatIsIncluded && product.whatIsIncluded.length > 0)) && (
                      <Accordion title="Что внутри" icon={<FileText className="w-4 h-4 text-blue-500" />}>
                        {product.category === 'КТП на каждый день' ? whatIsIncludedKtp : (
                          product.whatIsIncluded!.map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                              <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />{item}
                            </div>
                          ))
                        )}
                      </Accordion>
                    )}

                    {product.category === 'КТП на каждый день' && (
                      <Accordion title="Как использовать" icon={<Wrench className="w-4 h-4 text-gray-500" />}>
                        {['использовать полностью без изменений', 'вносить правки под свою группу', 'добавлять свои формы работы', 'заменять занятия на свои УМК'].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />{item}
                          </div>
                        ))}
                      </Accordion>
                    )}

                    <Accordion title="После покупки" icon={<PackageCheck className="w-4 h-4 text-gray-500" />}>
                      {['готовый план на весь месяц', 'не нужно придумывать занятия', 'можно работать сразу'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{item}
                        </div>
                      ))}
                    </Accordion>

                    <Accordion title="Что вы получите" icon={<ListChecks className="w-4 h-4 text-green-500" />}>
                      {whatYouGet.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{item}
                        </div>
                      ))}
                      <p className="text-xs text-green-700 font-medium flex items-center gap-1.5 pt-1">
                        <Sparkles className="w-3.5 h-3.5" />Материал готов к использованию без доработки
                      </p>
                    </Accordion>
                  </div>
                )}
              </div>

              {/* ── MOBILE CROSS-SELL (secondary, below details) ── */}
              <div className="space-y-3 pt-1">
                {relatedProducts.length > 0 && (
                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5" />Чаще всего берут вместе
                    </p>
                    {relatedProducts.map(({ type, product: rp }) => {
                      const inCart = items.some(i => i.id === rp.id) || addedItems.has(rp.id);
                      const typeLabel = type === 'next_month' ? 'следующий месяц' : type === 'previous_month' ? 'предыдущий месяц' : null;
                      return (
                        <div key={rp.id} className="flex items-center justify-between gap-3 py-1.5 border-t border-gray-100 first:border-t-0 first:pt-0">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-700 font-medium leading-snug line-clamp-2">{rp.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-gray-400">{rp.price.toLocaleString('ru-RU')} ₽</p>
                              {typeLabel && <span className="text-xs text-blue-500 font-medium">{typeLabel}</span>}
                            </div>
                          </div>
                          {inCart ? (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                              <Check className="w-3 h-3" />Добавлено
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddUpsell(rp)}
                              className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap"
                            >
                              <Plus className="w-3 h-3" />Добавить
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 leading-snug mb-1">Не возвращаться к планированию весь год?</p>
                      <button
                        onClick={() => onNavigate('store-materials')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        КТП на весь учебный год<ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* bottom padding for sticky bar */}
              <div className="h-20" />
            </div>

            {/* ── DESKTOP: info blocks (static, tighter spacing) ── */}
            <div className="hidden lg:block space-y-3">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-500" />Кому подходит
                </h2>
                <ul className="space-y-1.5">
                  {forWhom.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>

              {(product.category === 'КТП на каждый день' || (product.whatIsIncluded && product.whatIsIncluded.length > 0)) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />Что внутри
                  </h2>
                  {product.category === 'КТП на каждый день' ? whatIsIncludedKtp : (
                    <ul className="space-y-2">
                      {product.whatIsIncluded!.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />{item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {product.category === 'КТП на каждый день' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-500" />Как использовать
                  </h2>
                  <ul className="space-y-2">
                    {['использовать полностью без изменений', 'вносить правки под свою группу', 'добавлять свои формы работы', 'заменять занятия на свои УМК'].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl aspect-video flex flex-col items-center justify-center text-center p-8 overflow-hidden">
                <ProductPreviewImage src={product.coverUrl} />
                <button onClick={() => setShowPreview(true)} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  <Eye className="w-3.5 h-3.5" />Открыть предпросмотр
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">После покупки у вас будет:</p>
                <ul className="space-y-1.5">
                  {['готовый план на весь месяц', 'не нужно придумывать занятия', 'можно работать сразу'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-green-500" />Что вы получите
                </h2>
                <ul className="space-y-2">
                  {whatYouGet.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{item}
                    </li>
                  ))}
                </ul>
                <p className="mt-2.5 text-xs text-green-700 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />Материал готов к использованию без доработки
                </p>
              </div>

              {relatedProducts.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-gray-500" />Чаще всего берут вместе с этим
                  </h2>
                  {relatedProducts.map(({ type, product: rp }) => {
                    const inCart = items.some(i => i.id === rp.id) || addedItems.has(rp.id);
                    const typeLabel = type === 'next_month' ? 'следующий месяц' : type === 'previous_month' ? 'предыдущий месяц' : null;
                    return (
                      <div key={rp.id} className="flex items-center justify-between gap-3 py-2 border-t border-gray-100 first:border-t-0 first:pt-0">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 font-medium leading-snug line-clamp-2">{rp.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">{rp.price.toLocaleString('ru-RU')} ₽</p>
                            {typeLabel && <span className="text-xs text-blue-500 font-medium">{typeLabel}</span>}
                          </div>
                        </div>
                        {inCart ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                            <Check className="w-3 h-3" />Добавлено
                          </span>
                        ) : (
                          <button onClick={() => handleAddUpsell(rp)} className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap">
                            <Plus className="w-3 h-3" />Добавить к заказу
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug mb-1">Хотите не возвращаться к планированию весь год?</p>
                    <p className="text-xs text-gray-500 mb-1.5">Сразу готовый план на весь учебный год</p>
                    <button onClick={() => onNavigate('store-materials')} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors">
                      Смотреть КТП на весь учебный год<ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT STICKY COLUMN (desktop only) ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 border-b border-blue-100">
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-3xl font-bold text-gray-900">{product.price.toLocaleString('ru-RU')}</span>
                  <span className="text-lg font-medium text-gray-600">₽</span>
                </div>
                <p className="text-xs text-gray-500">Разовая покупка — навсегда ваше</p>
              </div>

              <div className="p-4 space-y-2">
                <Button className={`w-full justify-center ${isInCart ? 'bg-green-500 hover:bg-green-600' : ''}`} onClick={handleAddToCart}>
                  {isInCart ? <><Check className="w-4 h-4" />В корзине</> : <><ShoppingCart className="w-4 h-4" />Купить и скачать сразу</>}
                </Button>

                {!isInCart && (
                  <p className="text-center text-xs text-gray-400">
                    Скачаете через 10 секунд после оплаты · без лишних шагов
                  </p>
                )}

                <div className="flex items-center gap-2.5 px-3 py-2 bg-green-50 border border-green-200 rounded-lg" style={{ minHeight: '2.25rem' }}>
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                  <span className="text-xs font-medium text-gray-700 leading-snug flex-1 overflow-hidden">
                    <InlineActivityHint messages={ctaHints} intervalMs={20000} intervalJitterMs={10000} />
                  </span>
                </div>

                {isInCart && (
                  <Button variant="secondary" className="w-full justify-center border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => onNavigate('cart')}>
                    Перейти в корзину
                  </Button>
                )}
              </div>

              <div className="px-4 pb-4">
                {subscriptionActivated ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-center">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-green-800 leading-snug">Подписка оформлена</p>
                    <p className="text-xs text-green-600 mt-0.5">Библиотека открыта + скидка 25% на магазин</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-snug">Больше материалов по подписке</p>
                        <p className="text-xs text-gray-600 mt-0.5">Библиотека + помощник + скидка 25% на покупки в магазине</p>
                      </div>
                    </div>
                    <div className="bg-amber-100 rounded-lg px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">1 документ сейчас:</span>
                        <span className="font-medium text-gray-700">{product.price.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">С подпиской:</span>
                        <span className="font-semibold text-amber-900">{discountedPrice.toLocaleString('ru-RU')} ₽ за документ</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-amber-200 pt-1 mt-0.5">
                        <span className="text-green-700 font-medium">Экономия:</span>
                        <span className="font-bold text-green-700">{saving.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-amber-200 pt-1 mt-0.5">
                        <span className="text-gray-600">Подписка:</span>
                        <span className="font-bold text-amber-900">278 ₽/мес</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSubscriptionActivated(true)}
                      className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl py-2.5 px-3 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />Получить доступ за 278 ₽/мес
                    </button>
                  </div>
                )}
              </div>

              <div className="px-4 pb-4 space-y-1.5 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Tag className="w-3.5 h-3.5 text-gray-400" /><span>Разовая покупка без подписки</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Check className="w-3.5 h-3.5 text-green-500" /><span>Формат {product.fileType} · готов к работе сразу</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Sparkles className="w-3.5 h-3.5 text-green-500" /><span>Уже используют в 1000+ ДОУ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY MOBILE BUY BAR ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-shrink-0">
            <div className="text-xl font-bold text-gray-900 leading-none">{product.price.toLocaleString('ru-RU')} ₽</div>
            <div className="text-xs text-gray-400 mt-0.5">навсегда ваше</div>
          </div>
          <Button
            className={`flex-1 justify-center py-3 text-base ${isInCart ? 'bg-green-500 hover:bg-green-600' : ''}`}
            onClick={isInCart ? () => onNavigate('cart') : handleAddToCart}
          >
            {isInCart ? <><Check className="w-4 h-4" />Перейти в корзину</> : <><ShoppingCart className="w-4 h-4" />Купить и скачать сразу</>}
          </Button>
        </div>
      </div>
    </>
  );
}
