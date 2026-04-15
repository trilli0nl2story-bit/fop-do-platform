import { useState, useCallback } from 'react';
import { FileText, Eye, EyeOff, Plus, Pencil, Trash2, CheckCircle, AlertCircle, Search, Package } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CmsProduct, getAllProducts, deleteCmsProduct, saveCmsProduct, createEmptyProduct } from '../../lib/cmsProducts';
import { AdminProductEditor } from './AdminProductEditor';

import { CmsAccessType } from '../../lib/cmsProducts';

type FilterStatus = 'all' | 'published' | 'hidden';
type FilterSection = 'all' | CmsAccessType;

export function AdminDocuments() {
  const [products, setProducts] = useState<CmsProduct[]>(() => getAllProducts());
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sectionFilter, setSectionFilter] = useState<FilterSection>('all');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<CmsProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const reload = useCallback(() => {
    setProducts(getAllProducts());
  }, []);

  const filtered = products.filter(p => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'published' && p.isPublished) ||
      (filter === 'hidden' && !p.isPublished);
    const matchesSection =
      sectionFilter === 'all' ||
      (p.accessType ?? 'store') === sectionFilter;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSection && matchesSearch;
  });

  const handleTogglePublish = (product: CmsProduct) => {
    const updated = { ...product, isPublished: !product.isPublished };
    saveCmsProduct(updated);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteCmsProduct(id);
    setDeleteConfirm(null);
    reload();
  };

  const handleEditSaved = () => {
    setEditingProduct(null);
    reload();
  };

  const publishedCount = products.filter(p => p.isPublished).length;
  const hiddenCount = products.filter(p => !p.isPublished).length;

  const sourceLabel = (p: CmsProduct) =>
    p.source === 'hardcoded' ? 'исходные данные' : 'CMS';

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Продукты</h1>
          <p className="text-gray-600 text-sm">Управление каталогом продуктов платформы</p>
        </div>
        <Button size="sm" onClick={() => setEditingProduct(createEmptyProduct())}>
          <Plus className="w-4 h-4" />
          Добавить продукт
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card hover={false}>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <p className="text-sm text-gray-600">Всего продуктов</p>
        </Card>
        <Card hover={false}>
          <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
          <p className="text-sm text-gray-600">Опубликованных</p>
        </Card>
        <Card hover={false}>
          <p className="text-2xl font-bold text-gray-400">{hiddenCount}</p>
          <p className="text-sm text-gray-600">Скрытых</p>
        </Card>
      </div>

      <Card hover={false}>
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию или категории..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
              />
            </div>
            <div className="flex gap-1">
              {([['all', 'Все'], ['published', 'Опубликованные'], ['hidden', 'Скрытые']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === val ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {([
              ['all', 'Все разделы', ''],
              ['store', 'Магазин', 'bg-blue-50 text-blue-600'],
              ['free', 'Бесплатно', 'bg-green-50 text-green-600'],
              ['subscription', 'По подписке', 'bg-amber-50 text-amber-600'],
            ] as [FilterSection, string, string][]).map(([val, label, activeClass]) => (
              <button
                key={val}
                onClick={() => setSectionFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                  sectionFilter === val
                    ? activeClass || 'bg-gray-100 text-gray-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50'
                } ${sectionFilter === val ? 'border-current/20 border' : 'border border-transparent'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Продуктов не найдено</p>
            <p className="text-sm mt-1">Попробуйте изменить фильтр или поисковый запрос</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3">Продукт</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden sm:table-cell">Категория</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden lg:table-cell">Раздел</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden md:table-cell">Цена</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3">Статус</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{product.title}</p>
                          <p className="text-xs text-gray-400">{product.fileType} · {sourceLabel(product)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600 hidden sm:table-cell">{product.categoryName || '—'}</td>
                    <td className="py-3 hidden lg:table-cell">
                      {(() => {
                        const at = product.accessType ?? 'store';
                        if (at === 'free') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Бесплатно</span>;
                        if (at === 'subscription') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">По подписке</span>;
                        return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Магазин</span>;
                      })()}
                    </td>
                    <td className="py-3 text-sm text-gray-800 font-medium hidden md:table-cell">
                      {(product.accessType ?? 'store') === 'store' && product.price > 0 ? `${product.price} ₽` : '—'}
                    </td>
                    <td className="py-3">
                      {product.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-50">
                          <CheckCircle className="w-3 h-3" /> Опубликован
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                          <AlertCircle className="w-3 h-3" /> Черновик
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingProduct(product)}
                          title="Редактировать"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(product)}
                          title={product.isPublished ? 'Скрыть' : 'Опубликовать'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {product.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {product.source === 'cms' && (
                          deleteConfirm === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Удалить
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              title="Удалить"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingProduct && (
        <AdminProductEditor
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
}
