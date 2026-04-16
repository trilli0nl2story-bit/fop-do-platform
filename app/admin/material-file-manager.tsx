'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FilePlus,
  FileText,
  Loader2,
  PlusCircle,
  Search,
  Upload,
  X,
} from 'lucide-react';

type AccessFilter = 'all' | 'store' | 'free' | 'subscription';
type FileRole = 'paid' | 'preview' | 'cover';

interface MaterialRow {
  id: string;
  slug: string;
  title: string;
  accessType: string;
  fileType: string | null;
  isPublished: boolean;
  categoryName: string;
  fileCount: number;
}

interface MaterialInfo {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  accessType: string;
  categoryId: string | null;
  fileType: string | null;
  priceRubles: number;
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  program: string;
}

interface MaterialFileRow {
  id: string;
  fileRole: string;
  storageKey: string;
  fileSize: number | null;
  createdAt: string;
}

interface MaterialForm {
  title: string;
  shortDescription: string;
  fullDescription: string;
  accessType: 'free' | 'subscription' | 'store';
  categoryId: string;
  fileType: 'PDF' | 'DOCX' | 'PPT' | 'PPTX';
  priceRubles: string;
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  program: string;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
}

const accessLabels: Record<AccessFilter, string> = {
  all: 'Все',
  store: 'Магазин',
  free: 'Бесплатные',
  subscription: 'Подписка',
};

const fileRoleLabels: Record<FileRole, string> = {
  paid: 'Основной файл',
  preview: 'Превью',
  cover: 'Обложка',
};

function materialToForm(material: MaterialInfo): MaterialForm {
  const safeAccessType = ['free', 'subscription', 'store'].includes(material.accessType)
    ? material.accessType
    : 'store';
  const safeFileType = material.fileType && ['PDF', 'DOCX', 'PPT', 'PPTX'].includes(material.fileType)
    ? material.fileType
    : 'PDF';

  return {
    title: material.title,
    shortDescription: material.shortDescription ?? '',
    fullDescription: material.fullDescription ?? '',
    accessType: safeAccessType as MaterialForm['accessType'],
    categoryId: material.categoryId ?? '',
    fileType: safeFileType as MaterialForm['fileType'],
    priceRubles: String(material.priceRubles ?? 0),
    isPublished: material.isPublished,
    isFeatured: material.isFeatured,
    seoTitle: material.seoTitle ?? '',
    seoDescription: material.seoDescription ?? '',
    program: material.program ?? '',
  };
}

function emptyMaterialForm(): MaterialForm {
  return {
    title: '',
    shortDescription: '',
    fullDescription: '',
    accessType: 'store',
    categoryId: '',
    fileType: 'PDF',
    priceRubles: '0',
    isPublished: false,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    program: '',
  };
}

function normalizeFormForCompare(form: MaterialForm | null) {
  if (!form) return '';
  return JSON.stringify({
    ...form,
    priceRubles: form.accessType === 'store' ? Number(form.priceRubles || 0) : 0,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(n: number | null) {
  if (!n) return 'размер не указан';
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(2)} МБ`;
}

function roleBadgeClass(role: string) {
  if (role === 'paid') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (role === 'preview') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

export function MaterialFileManager() {
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialInfo | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialForm | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [statusChangeConfirmed, setStatusChangeConfirmed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<MaterialForm>(() => emptyMaterialForm());
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [files, setFiles] = useState<MaterialFileRow[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [uploadRole, setUploadRole] = useState<FileRole>('paid');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const [manualOpen, setManualOpen] = useState(false);
  const [manualRole, setManualRole] = useState<FileRole>('paid');
  const [manualKey, setManualKey] = useState('');
  const [manualSize, setManualSize] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');

  const selectedSlug = selectedMaterial?.slug ?? '';

  useEffect(() => {
    fetch('/api/admin/categories', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => setCategories(data?.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMaterialsLoading(true);
      setMaterialsError('');
      try {
        const params = new URLSearchParams({
          search,
          accessType: accessFilter,
          limit: '80',
        });
        const res = await fetch(`/api/admin/materials?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Не удалось загрузить материалы');
        setMaterials(data.materials ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setMaterialsError(err instanceof Error ? err.message : 'Не удалось загрузить материалы');
      } finally {
        if (!controller.signal.aborted) setMaterialsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, accessFilter]);

  async function selectMaterial(slug: string) {
    setDetailsLoading(true);
    setDetailsError('');
    setUploadError('');
    setUploadSuccess('');
    setManualError('');
    setManualSuccess('');
    setSaveError('');
    setSaveSuccess('');
    setStatusChangeConfirmed(false);
    setUploadFile(null);
    try {
      const res = await fetch(`/api/admin/material-files?materialSlug=${encodeURIComponent(slug)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось открыть материал');
      setSelectedMaterial(data.material);
      setMaterialForm(materialToForm(data.material));
      setFiles(data.files ?? []);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Не удалось открыть материал');
    } finally {
      setDetailsLoading(false);
    }
  }

  function updateMaterialForm<K extends keyof MaterialForm>(key: K, value: MaterialForm[K]) {
    setMaterialForm(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      if (key === 'accessType' && value !== 'store') {
        next.priceRubles = '0';
      }
      return next;
    });
    setSaveError('');
    setSaveSuccess('');
    setStatusChangeConfirmed(false);
  }

  function updateCreateForm<K extends keyof MaterialForm>(key: K, value: MaterialForm[K]) {
    setCreateForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'accessType' && value !== 'store') {
        next.priceRubles = '0';
      }
      return next;
    });
    setCreateError('');
    setCreateSuccess('');
  }

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          priceRubles: createForm.accessType === 'store' ? Number(createForm.priceRubles || 0) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось создать материал');

      setCreateSuccess('Материал создан. Теперь можно загрузить файл.');
      setCreateForm(emptyMaterialForm());
      setCreateOpen(false);
      setSearch('');
      setAccessFilter('all');
      setMaterials(prev => [{
        id: data.material.id,
        slug: data.material.slug,
        title: data.material.title,
        accessType: data.material.accessType,
        fileType: data.material.fileType,
        isPublished: data.material.isPublished,
        categoryName: categories.find(category => category.id === data.material.categoryId)?.name ?? '',
        fileCount: 0,
      }, ...prev]);
      await selectMaterial(data.material.slug);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Не удалось создать материал');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleSaveMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMaterial || !materialForm) return;

    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await fetch(`/api/admin/materials/${encodeURIComponent(selectedMaterial.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...materialForm,
          priceRubles: materialForm.accessType === 'store' ? Number(materialForm.priceRubles || 0) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось сохранить изменения');

      setSelectedMaterial(data.material);
      setMaterialForm(materialToForm(data.material));
      setStatusChangeConfirmed(false);
      setSaveSuccess('Изменения сохранены');
      setMaterials(prev => prev.map(item => (
        item.id === data.material.id
          ? {
              ...item,
              title: data.material.title,
              accessType: data.material.accessType,
              fileType: data.material.fileType,
              isPublished: data.material.isPublished,
              categoryName: categories.find(category => category.id === data.material.categoryId)?.name ?? '',
            }
          : item
      )));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось сохранить изменения');
    } finally {
      setSaveLoading(false);
    }
  }

  async function refreshSelectedFiles() {
    if (!selectedSlug) return;
    const res = await fetch(`/api/admin/material-files?materialSlug=${encodeURIComponent(selectedSlug)}`, {
      credentials: 'include',
    });
    if (!res.ok) return;
    const data = await res.json();
    setFiles(data.files ?? []);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMaterial || !uploadFile) return;
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const form = new FormData();
      form.append('materialSlug', selectedMaterial.slug);
      form.append('fileRole', uploadRole);
      form.append('file', uploadFile);

      const res = await fetch('/api/admin/material-files/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Не удалось загрузить файл');
      setUploadSuccess(`Файл загружен и подключён к материалу`);
      setUploadFile(null);
      await refreshSelectedFiles();
      setMaterials(prev => prev.map(item => (
        item.slug === selectedMaterial.slug ? { ...item, fileCount: item.fileCount + 1 } : item
      )));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Не удалось загрузить файл');
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleManualRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMaterial || !manualKey.trim()) return;
    setManualLoading(true);
    setManualError('');
    setManualSuccess('');
    try {
      const fileSize = manualSize.trim() ? parseInt(manualSize.trim(), 10) : null;
      if (fileSize !== null && (!Number.isFinite(fileSize) || fileSize < 0)) {
        throw new Error('Размер файла должен быть положительным числом');
      }

      const res = await fetch('/api/admin/material-files', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialSlug: selectedMaterial.slug,
          fileRole: manualRole,
          storageKey: manualKey.trim(),
          fileSize,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось зарегистрировать файл');
      setManualSuccess('Файл зарегистрирован');
      setManualKey('');
      setManualSize('');
      await refreshSelectedFiles();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Не удалось зарегистрировать файл');
    } finally {
      setManualLoading(false);
    }
  }

  const selectedFilesTitle = useMemo(() => {
    if (!selectedMaterial) return 'Выберите материал слева';
    return selectedMaterial.title;
  }, [selectedMaterial]);

  const savedForm = selectedMaterial ? materialToForm(selectedMaterial) : null;
  const hasUnsavedChanges = normalizeFormForCompare(materialForm) !== normalizeFormForCompare(savedForm);
  const publicationChanged = Boolean(
    selectedMaterial &&
    materialForm &&
    selectedMaterial.isPublished !== materialForm.isPublished
  );
  const saveDisabled =
    saveLoading ||
    !hasUnsavedChanges ||
    !materialForm?.title.trim() ||
    (publicationChanged && !statusChangeConfirmed);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Документы</h1>
          <p className="text-sm text-gray-500">
            Здесь создаются материалы, выбирается раздел и подключаются файлы: основной документ, превью или обложка.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen(true);
            setCreateError('');
            setCreateSuccess('');
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Создать материал
        </button>
      </div>

      {createSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {createSuccess}
        </div>
      )}

      {createOpen && (
        <section className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Новый материал</h2>
              <p className="text-sm text-gray-500 mt-1">
                Заполните понятные поля. Адрес страницы создастся автоматически из названия.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateMaterial} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Название *</label>
                <input
                  value={createForm.title}
                  onChange={e => updateCreateForm('title', e.target.value)}
                  maxLength={220}
                  required
                  placeholder="Например: Конспект занятия «Весна пришла»"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Раздел</label>
                <select
                  value={createForm.categoryId}
                  onChange={e => updateCreateForm('categoryId', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Без раздела</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Программа</label>
                <input
                  value={createForm.program}
                  onChange={e => updateCreateForm('program', e.target.value)}
                  maxLength={160}
                  placeholder="Например: ФОП ДО"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Тип доступа</label>
                <select
                  value={createForm.accessType}
                  onChange={e => updateCreateForm('accessType', e.target.value as MaterialForm['accessType'])}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="store">Магазин</option>
                  <option value="free">Бесплатный</option>
                  <option value="subscription">По подписке</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Тип файла</label>
                <select
                  value={createForm.fileType}
                  onChange={e => updateCreateForm('fileType', e.target.value as MaterialForm['fileType'])}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                  <option value="PPT">PPT</option>
                  <option value="PPTX">PPTX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Цена, ₽</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={createForm.priceRubles}
                  onChange={e => updateCreateForm('priceRubles', e.target.value)}
                  disabled={createForm.accessType !== 'store'}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              <div className="flex flex-col justify-end gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={createForm.isPublished}
                    onChange={e => updateCreateForm('isPublished', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  Опубликовать сразу
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={createForm.isFeatured}
                    onChange={e => updateCreateForm('isFeatured', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  Избранный материал
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Короткое описание</label>
                <textarea
                  value={createForm.shortDescription}
                  onChange={e => updateCreateForm('shortDescription', e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Полное описание</label>
                <textarea
                  value={createForm.fullDescription}
                  onChange={e => updateCreateForm('fullDescription', e.target.value)}
                  maxLength={5000}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                />
              </div>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs text-green-800">
              Защита включена: slug создаётся автоматически, новый материал пишется в журнал изменений, файл можно загрузить сразу после создания.
            </div>

            {createError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {createError}
              </div>
            )}

            <button
              type="submit"
              disabled={createLoading || !createForm.title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              {createLoading ? 'Создание...' : 'Создать материал'}
            </button>
          </form>
        </section>
      )}

      <div className="grid lg:grid-cols-[minmax(280px,380px)_1fr] gap-5">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию или slug"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(accessLabels) as AccessFilter[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccessFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    accessFilter === key
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
                  }`}
                >
                  {accessLabels[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[650px] overflow-y-auto">
            {materialsLoading && (
              <div className="py-10 flex items-center justify-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {materialsError && (
              <div className="m-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">
                {materialsError}
              </div>
            )}
            {!materialsLoading && !materialsError && materials.length === 0 && (
              <div className="p-6 text-sm text-gray-400">Материалы не найдены.</div>
            )}
            {!materialsLoading && !materialsError && materials.map(material => (
              <button
                key={material.id}
                type="button"
                onClick={() => selectMaterial(material.slug)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                  selectedMaterial?.slug === material.slug ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{material.title}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1 truncate">{material.slug}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 flex-shrink-0">
                    {material.fileCount}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {material.accessType}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {material.fileType ?? 'файл'}
                  </span>
                  {material.categoryName && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 truncate max-w-[150px]">
                      {material.categoryName}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          {detailsLoading ? (
            <div className="py-16 flex items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">{selectedFilesTitle}</h2>
                  {selectedMaterial ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {selectedMaterial.accessType}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {selectedMaterial.fileType ?? 'файл'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedMaterial.isPublished ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {selectedMaterial.isPublished ? 'Опубликован' : 'Не опубликован'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      Слева можно найти материал по названию или slug и сразу загрузить к нему файл.
                    </p>
                  )}
                </div>
              </div>

              {detailsError && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {detailsError}
                </div>
              )}

              {selectedMaterial && (
                <div className="space-y-5">
                  {materialForm && (
                    <form onSubmit={handleSaveMaterial} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Карточка материала</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Изменения не сохраняются автоматически. Slug заблокирован, чтобы не сломать ссылки.
                          </p>
                        </div>
                        {hasUnsavedChanges && (
                          <span className="self-start text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                            есть несохранённые изменения
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Название *</label>
                          <input
                            value={materialForm.title}
                            onChange={e => updateMaterialForm('title', e.target.value)}
                            maxLength={220}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                          <input
                            value={selectedMaterial.slug}
                            disabled
                            className="w-full px-3.5 py-2.5 border border-gray-200 bg-white/70 rounded-xl text-sm font-mono text-gray-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Раздел</label>
                          <select
                            value={materialForm.categoryId}
                            onChange={e => updateMaterialForm('categoryId', e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">Без раздела</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Программа</label>
                          <input
                            value={materialForm.program}
                            onChange={e => updateMaterialForm('program', e.target.value)}
                            maxLength={160}
                            placeholder="Например: ФОП ДО"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Короткое описание</label>
                          <textarea
                            value={materialForm.shortDescription}
                            onChange={e => updateMaterialForm('shortDescription', e.target.value)}
                            maxLength={500}
                            rows={2}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Полное описание</label>
                          <textarea
                            value={materialForm.fullDescription}
                            onChange={e => updateMaterialForm('fullDescription', e.target.value)}
                            maxLength={5000}
                            rows={4}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Тип доступа</label>
                          <select
                            value={materialForm.accessType}
                            onChange={e => updateMaterialForm('accessType', e.target.value as MaterialForm['accessType'])}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="store">Магазин</option>
                            <option value="free">Бесплатный</option>
                            <option value="subscription">По подписке</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Тип файла</label>
                          <select
                            value={materialForm.fileType}
                            onChange={e => updateMaterialForm('fileType', e.target.value as MaterialForm['fileType'])}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="PDF">PDF</option>
                            <option value="DOCX">DOCX</option>
                            <option value="PPT">PPT</option>
                            <option value="PPTX">PPTX</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Цена, ₽</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={materialForm.priceRubles}
                            onChange={e => updateMaterialForm('priceRubles', e.target.value)}
                            disabled={materialForm.accessType !== 'store'}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                          {materialForm.accessType !== 'store' && (
                            <p className="text-xs text-gray-400 mt-1">Для бесплатных и подписочных материалов цена всегда 0 ₽.</p>
                          )}
                        </div>

                        <div className="flex flex-col justify-end gap-2">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={materialForm.isPublished}
                              onChange={e => updateMaterialForm('isPublished', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            Опубликован на сайте
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={materialForm.isFeatured}
                              onChange={e => updateMaterialForm('isFeatured', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            Избранный материал
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SEO-заголовок</label>
                          <input
                            value={materialForm.seoTitle}
                            onChange={e => updateMaterialForm('seoTitle', e.target.value)}
                            maxLength={220}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SEO-описание</label>
                          <input
                            value={materialForm.seoDescription}
                            onChange={e => updateMaterialForm('seoDescription', e.target.value)}
                            maxLength={500}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      {publicationChanged && (
                        <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          <input
                            type="checkbox"
                            checked={statusChangeConfirmed}
                            onChange={e => setStatusChangeConfirmed(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600"
                          />
                          <span>
                            Я понимаю, что меняю видимость материала на сайте.
                          </span>
                        </label>
                      )}

                      <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs text-green-800">
                        Защита включена: сохраняет только администратор, slug нельзя случайно изменить, каждое сохранение пишется в журнал изменений.
                      </div>

                      {saveError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {saveError}
                        </div>
                      )}
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          {saveSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={saveDisabled}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {saveLoading ? 'Сохранение...' : 'Сохранить изменения'}
                      </button>
                    </form>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Подключённые файлы ({files.length})
                    </p>
                    {files.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-400">
                        У этого материала пока нет файлов.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {files.map(file => (
                          <div key={file.id} className="rounded-xl border border-gray-100 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${roleBadgeClass(file.fileRole)}`}>
                                {fileRoleLabels[file.fileRole as FileRole] ?? file.fileRole}
                              </span>
                              <span className="text-xs text-gray-400">{formatBytes(file.fileSize)}</span>
                              <span className="text-xs text-gray-400">{formatDate(file.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono break-all">{file.storageKey}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <p className="text-sm font-semibold text-gray-800">Загрузить файл</p>
                    </div>
                    <form onSubmit={handleUpload} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Тип файла</label>
                        <select
                          value={uploadRole}
                          onChange={e => setUploadRole(e.target.value as FileRole)}
                          disabled={uploadLoading}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                        >
                          <option value="paid">Основной файл для скачивания</option>
                          <option value="preview">Превью для просмотра</option>
                          <option value="cover">Обложка</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Файл с компьютера</label>
                        <input
                          key={uploadSuccess}
                          type="file"
                          onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                          disabled={uploadLoading}
                          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 disabled:opacity-60"
                        />
                      </div>
                      {uploadError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {uploadError}
                        </div>
                      )}
                      {uploadSuccess && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          {uploadSuccess}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={uploadLoading || !uploadFile}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploadLoading ? 'Загрузка...' : 'Загрузить и подключить'}
                      </button>
                    </form>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setManualOpen(open => !open)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                      <FilePlus className="w-4 h-4" />
                      Подключить файл по адресу
                    </button>
                    {manualOpen && (
                      <form onSubmit={handleManualRegister} className="mt-3 space-y-3">
                        <select
                          value={manualRole}
                          onChange={e => setManualRole(e.target.value as FileRole)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                        >
                          <option value="paid">Основной файл</option>
                          <option value="preview">Превью</option>
                          <option value="cover">Обложка</option>
                        </select>
                        <input
                          value={manualKey}
                          onChange={e => setManualKey(e.target.value)}
                          placeholder="database/materials/paid/example.pdf"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono"
                        />
                        <input
                          value={manualSize}
                          onChange={e => setManualSize(e.target.value)}
                          placeholder="Размер файла в байтах, необязательно"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
                        />
                        {manualError && <p className="text-sm text-red-600">{manualError}</p>}
                        {manualSuccess && <p className="text-sm text-green-700">{manualSuccess}</p>}
                        <button
                          type="submit"
                          disabled={manualLoading || !manualKey.trim()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                        >
                          {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                          Подключить
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
