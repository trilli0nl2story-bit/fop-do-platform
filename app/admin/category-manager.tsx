'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, FolderPlus, Loader2, Save } from 'lucide-react';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  isVisible: boolean;
  sortOrder: number;
}

interface CategoryForm {
  name: string;
  description: string;
  sortOrder: string;
  isVisible: boolean;
}

function toForm(category?: CategoryRow): CategoryForm {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    sortOrder: String(category?.sortOrder ?? 0),
    isVisible: category?.isVisible ?? true,
  };
}

export function CategoryManager() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<CategoryForm>(() => toForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedCategory = categories.find(category => category.id === selectedId) ?? null;

  async function loadCategories() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось загрузить разделы');
      setCategories(data.categories ?? []);
      if (!selectedId && data.categories?.[0]) {
        setSelectedId(data.categories[0].id);
        setForm(toForm(data.categories[0]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить разделы');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectCategory(category: CategoryRow) {
    setSelectedId(category.id);
    setForm(toForm(category));
    setError('');
    setSuccess('');
  }

  function startCreate() {
    setSelectedId('');
    setForm(toForm());
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder || 0),
      };
      const res = await fetch(
        selectedId ? `/api/admin/categories/${encodeURIComponent(selectedId)}` : '/api/admin/categories',
        {
          method: selectedId ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось сохранить раздел');

      setSuccess(selectedId ? 'Раздел сохранён' : 'Раздел создан');
      setSelectedId(data.category.id);
      setForm(toForm(data.category));
      setCategories(prev => {
        const exists = prev.some(category => category.id === data.category.id);
        const next = exists
          ? prev.map(category => (category.id === data.category.id ? data.category : category))
          : [...prev, data.category];
        return next.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru'));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить раздел');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-sm text-gray-500 mt-1">Добавляйте разделы, меняйте порядок и скрывайте лишнее с сайта.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          Добавить раздел
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(260px,360px)_1fr] gap-5">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Все разделы</p>
          </div>
          {loading ? (
            <div className="p-6 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка...
            </div>
          ) : (
            <div className="max-h-[620px] overflow-y-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedId === category.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{category.name}</p>
                      <p className="text-xs text-gray-400 truncate">{category.slug}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                      category.isVisible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {category.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {category.isVisible ? 'виден' : 'скрыт'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCategory ? 'Редактировать раздел' : 'Новый раздел'}
            </h2>
            {selectedCategory && (
              <p className="text-xs text-gray-400 mt-1">Slug не меняется: {selectedCategory.slug}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              maxLength={180}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Описание</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              maxLength={1000}
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Порядок</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <label className="flex items-end gap-2 text-sm text-gray-700 pb-2">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={e => setForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              Показывать на сайте
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Сохранение...' : 'Сохранить раздел'}
          </button>
        </form>
      </div>
    </div>
  );
}

