'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FilePlus,
  FileText,
  Loader2,
  Search,
  Upload,
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
  accessType: string;
  fileType: string | null;
  isPublished: boolean;
}

interface MaterialFileRow {
  id: string;
  fileRole: string;
  storageKey: string;
  fileSize: number | null;
  createdAt: string;
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

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialInfo | null>(null);
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
    setUploadFile(null);
    try {
      const res = await fetch(`/api/admin/material-files?materialSlug=${encodeURIComponent(slug)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Не удалось открыть материал');
      setSelectedMaterial(data.material);
      setFiles(data.files ?? []);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Не удалось открыть материал');
    } finally {
      setDetailsLoading(false);
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Документы</h1>
        <p className="text-sm text-gray-500">
          Здесь выбирается материал и подключаются файлы: основной документ, превью или обложка.
        </p>
      </div>

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
