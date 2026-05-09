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
    sortOrder: String(category?.sortOrder ?? 1),
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

  async function loadCategories(preferredSelectedId?: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось загрузить разделы');

      const nextCategories: CategoryRow[] = data.categories ?? [];
      setCategories(nextCategories);

      const nextSelectedId = preferredSelectedId ?? selectedId;
      const preferredCategory = nextCategories.find(category => category.id === nextSelectedId);
      if (preferredCategory) {
        setSelectedId(preferredCategory.id);
        setForm(toForm(preferredCategory));
      } else if (nextCategories[0]) {
        setSelectedId(nextCategories[0].id);
        setForm(toForm(nextCategories[0]));
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
        sortOrder: Number(form.sortOrder || 1),
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
      await loadCategories(data.category.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить раздел');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="mt-1 text-sm text-gray-500">
            Добавляйте разделы, меняйте порядок и скрывайте лишнее с сайта.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <FolderPlus className="h-4 w-4" />
          Добавить раздел
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(260px,360px)_1fr]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">Все разделы</p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка...
            </div>
          ) : (
            <div className="max-h-[620px] overflow-y-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    selectedId === category.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{category.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="truncate text-xs text-gray-400">{category.slug}</p>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          #{category.sortOrder}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        category.isVisible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {category.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {category.isVisible ? 'виден' : 'скрыт'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCategory ? 'Редактировать раздел' : 'Новый раздел'}
            </h2>
            {selectedCategory && (
              <p className="mt-1 text-xs text-gray-400">Slug не меняется: {selectedCategory.slug}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Название</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              maxLength={180}
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Описание</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              maxLength={1000}
              rows={4}
              className="w-full resize-y rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Порядок</label>
              <input
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={e => setForm(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-gray-400">
                Это место раздела в списке. Если номер уже занят, остальные разделы автоматически сдвинутся.
              </p>
            </div>

            <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={e => setForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Показывать на сайте
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Сохранение...' : 'Сохранить раздел'}
          </button>
        </form>
      </div>
    </div>
  );
}
