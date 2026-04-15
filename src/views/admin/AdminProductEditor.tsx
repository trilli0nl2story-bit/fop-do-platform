import { useState } from 'react';
import { X, Save, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { CmsProduct, CmsAccessType, generateSlug, saveCmsProduct } from '../../lib/cmsProducts';
import { getAllCategories } from '../../lib/cmsCategories';

const FILE_TYPES: CmsProduct['fileType'][] = ['PDF', 'DOCX', 'PPTX'];
const AGE_GROUPS = ['1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '1-3', '2-4', '3-5', '5-7', '3-7', '1-7'];

interface Props {
  product: CmsProduct;
  onClose: () => void;
  onSaved: () => void;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card hover={false} className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </Card>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function AdminProductEditor({ product: initial, onClose, onSaved }: Props) {
  const [p, setP] = useState<CmsProduct>(initial);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(', '));
  const categories = getAllCategories();

  const set = (key: keyof CmsProduct, value: unknown) => {
    setP(prev => ({ ...prev, [key]: value }));
  };

  const handleTitleBlur = () => {
    if (!p.slug || p.slug === '') {
      set('slug', generateSlug(p.title));
    }
  };

  const handleSave = () => {
    setSaving(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const toSave: CmsProduct = {
      ...p,
      tags,
      slug: p.slug || generateSlug(p.title),
    };
    saveCmsProduct(toSave);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
      <div className="w-full max-w-2xl bg-gray-50 h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-gray-900 text-base">
              {initial.id === '' || initial.source === 'cms' && !initial.title ? 'Новый продукт' : 'Редактировать продукт'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{p.isPublished ? 'Опубликован' : 'Черновик'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => set('isPublished', !p.isPublished)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                p.isPublished
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.isPublished ? 'Опубликован' : 'Черновик'}
            </button>
            <Button size="sm" onClick={handleSave} disabled={saving || !p.title.trim()}>
              <Save className="w-4 h-4" />
              Сохранить
            </Button>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1">
          <Section title="Основная информация">
            <Field label="Название">
              <Input
                value={p.title}
                onChange={e => set('title', e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Введите название продукта"
              />
            </Field>
            <Field label="Slug (URL)" hint="Генерируется автоматически из названия">
              <Input
                value={p.slug}
                onChange={e => set('slug', e.target.value)}
                placeholder="url-produkta"
              />
            </Field>
            <Field label="Краткое описание">
              <Textarea
                value={p.shortDescription}
                onChange={e => set('shortDescription', e.target.value)}
                placeholder="1-2 предложения для карточки товара"
                rows={2}
              />
            </Field>
            <Field label="Полное описание">
              <Textarea
                value={p.fullDescription}
                onChange={e => set('fullDescription', e.target.value)}
                placeholder="Подробное описание для страницы продукта"
                rows={4}
              />
            </Field>
          </Section>

          <Section title="Параметры">
            <Field label="Раздел размещения">
              <div className="flex gap-2">
                {([['store', 'Магазин'], ['free', 'Бесплатно'], ['subscription', 'По подписке']] as [CmsAccessType, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('accessType', val)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      (p.accessType ?? 'store') === val
                        ? val === 'store'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : val === 'free'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={(p.accessType ?? 'store') === 'store' ? 'Цена (₽) *' : 'Цена (₽)'}>
                <Input
                  type="number"
                  value={p.price}
                  onChange={e => set('price', Number(e.target.value))}
                  placeholder={(p.accessType ?? 'store') === 'store' ? '390' : '0'}
                  disabled={(p.accessType ?? 'store') !== 'store'}
                  className={(p.accessType ?? 'store') !== 'store' ? 'opacity-40' : ''}
                />
              </Field>
              <Field label="Тип файла">
                <select
                  value={p.fileType}
                  onChange={e => set('fileType', e.target.value as CmsProduct['fileType'])}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white"
                >
                  {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Категория">
                <select
                  value={p.categoryName}
                  onChange={e => {
                    const cat = categories.find(c => c.name === e.target.value);
                    set('categoryName', e.target.value);
                    if (cat) set('categoryId', cat.id);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white"
                >
                  <option value="">— Выберите категорию —</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Возрастная группа">
                <select
                  value={p.ageGroup}
                  onChange={e => set('ageGroup', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white"
                >
                  <option value="">— Возраст —</option>
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a} лет</option>)}
                </select>
              </Field>
            </div>
            <Field label="Роль / должность педагога">
              <Input
                value={p.role}
                onChange={e => set('role', e.target.value)}
                placeholder="Воспитатель, методист, логопед..."
              />
            </Field>
            <Field label="Теги (через запятую)">
              <Input
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="ФОП ДО, старшая группа, осень"
              />
            </Field>
            <Field label="Избранный продукт">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.isFeatured}
                  onChange={e => set('isFeatured', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Показывать в рекомендованных</span>
              </label>
            </Field>
          </Section>

          <Section title="Текст превью" defaultOpen={false}>
            <Field label="Текст предварительного просмотра">
              <Textarea
                value={p.previewText}
                onChange={e => set('previewText', e.target.value)}
                placeholder="Текст, который видит пользователь до покупки"
                rows={3}
              />
            </Field>
          </Section>

          <Section title="Секции страницы продукта" defaultOpen={false}>
            <Field label="Кому подходит">
              <Textarea
                value={p.forWhom}
                onChange={e => set('forWhom', e.target.value)}
                placeholder="Воспитателям групп компенсирующей направленности..."
                rows={2}
              />
            </Field>
            <Field label="Что внутри">
              <Textarea
                value={p.whatIsInside}
                onChange={e => set('whatIsInside', e.target.value)}
                placeholder="Список содержимого (по одному пункту на строку)"
                rows={4}
              />
            </Field>
            <Field label="Как использовать">
              <Textarea
                value={p.howToUse}
                onChange={e => set('howToUse', e.target.value)}
                placeholder="Инструкция по использованию материала"
                rows={3}
              />
            </Field>
            <Field label="После покупки">
              <Textarea
                value={p.afterPurchase}
                onChange={e => set('afterPurchase', e.target.value)}
                placeholder="Что происходит после оплаты"
                rows={2}
              />
            </Field>
            <Field label="Что вы получите">
              <Textarea
                value={p.whatYouGet}
                onChange={e => set('whatYouGet', e.target.value)}
                placeholder="Итоговая ценность для покупателя"
                rows={2}
              />
            </Field>
          </Section>

          <Section title="Файлы и медиа" defaultOpen={false}>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Файлы будут подключены к хранилищу на backend-этапе. Здесь можно сохранить URL заранее.
              </p>
            </div>
            <Field label="URL обложки (изображение)">
              <Input
                value={p.coverImageUrl}
                onChange={e => set('coverImageUrl', e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="URL файла превью (до покупки)">
              <Input
                value={p.previewFileUrl}
                onChange={e => set('previewFileUrl', e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="URL платного файла (после покупки)">
              <Input
                value={p.paidFileUrl}
                onChange={e => set('paidFileUrl', e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </Section>

          <Section title="Похожие продукты / перекрёстные продажи" defaultOpen={false}>
            <Field label="ID связанных продуктов (через запятую)" hint="Будет улучшено в backend-этапе">
              <Input
                value={p.relatedProductIds.join(', ')}
                onChange={e => set('relatedProductIds', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="cms-123, hc-5"
              />
            </Field>
          </Section>

          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving || !p.title.trim()}>
              <Save className="w-4 h-4" />
              Сохранить продукт
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
