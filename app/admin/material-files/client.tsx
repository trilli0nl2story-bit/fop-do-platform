'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FilePlus, FileText, AlertCircle, CheckCircle2, User, ShieldAlert, Loader2, Upload } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CurrentUser {
  id: string;
  email: string;
  isAdmin: boolean;
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

type LoadState = 'loading' | 'unauth' | 'forbidden' | 'ready';

const FILE_ROLE_LABELS: Record<string, string> = {
  paid: 'Платный (paid)',
  preview: 'Превью (preview)',
  cover: 'Обложка (cover)',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBytes(n: number | null) {
  if (!n) return '—';
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(2)} МБ`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminMaterialFilesClient() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Lookup form
  const [slugInput, setSlugInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [material, setMaterial] = useState<MaterialInfo | null>(null);
  const [existingFiles, setExistingFiles] = useState<MaterialFileRow[]>([]);

  // Upload form
  const [uploadRole, setUploadRole] = useState<'paid' | 'preview' | 'cover'>('paid');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Registration form
  const [regRole, setRegRole] = useState<'paid' | 'preview' | 'cover'>('paid');
  const [regKey, setRegKey] = useState('');
  const [regSize, setRegSize] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  async function refreshFiles(materialSlug: string) {
    const refRes = await fetch(
      `/api/admin/material-files?materialSlug=${encodeURIComponent(materialSlug)}`,
      { credentials: 'include' }
    );
    if (refRes.ok) {
      const refData = await refRes.json();
      setExistingFiles(refData.files ?? []);
    }
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/account/summary', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { setLoadState('unauth'); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (!data) { setLoadState('unauth'); return; }
        const u: CurrentUser = data.user;
        setCurrentUser(u);
        setLoadState(u.isAdmin ? 'ready' : 'forbidden');
      })
      .catch(() => setLoadState('unauth'));
  }, []);

  // ── Lookup ──────────────────────────────────────────────────────────────────
  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!slugInput.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setMaterial(null);
    setExistingFiles([]);
    setUploadFile(null);
    setUploadError('');
    setUploadSuccess('');
    setRegError('');
    setRegSuccess('');
    try {
      const res = await fetch(
        `/api/admin/material-files?materialSlug=${encodeURIComponent(slugInput.trim())}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error ?? `Ошибка ${res.status}`);
      } else {
        setMaterial(data.material);
        setExistingFiles(data.files ?? []);
      }
    } catch {
      setLookupError('Сетевая ошибка. Попробуйте ещё раз.');
    } finally {
      setLookupLoading(false);
    }
  }

  // ── Register file ───────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!material || !regKey.trim()) return;
    setRegLoading(true);
    setRegError('');
    setRegSuccess('');
    try {
      const fileSizeNum = regSize.trim() ? parseInt(regSize.trim(), 10) : null;
      if (regSize.trim() && (isNaN(fileSizeNum!) || fileSizeNum! < 0)) {
        setRegError('Размер файла должен быть положительным числом.');
        setRegLoading(false);
        return;
      }
      const res = await fetch('/api/admin/material-files', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialSlug: material.slug,
          fileRole: regRole,
          storageKey: regKey.trim(),
          fileSize: fileSizeNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error ?? `Ошибка ${res.status}`);
      } else {
        setRegSuccess(`Файл зарегистрирован (id: ${data.file?.id ?? '?'})`);
        setRegKey('');
        setRegSize('');
        await refreshFiles(material.slug);
      }
    } catch {
      setRegError('Сетевая ошибка. Попробуйте ещё раз.');
    } finally {
      setRegLoading(false);
    }
  }

  // ── Render: loading ─────────────────────────────────────────────────────────
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!material || !uploadFile) return;
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const form = new FormData();
      form.append('materialSlug', material.slug);
      form.append('fileRole', uploadRole);
      form.append('file', uploadFile);

      const res = await fetch('/api/admin/material-files/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.message ?? data.error ?? `Ошибка ${res.status}`);
      } else {
        setUploadSuccess(`Файл загружен и подключён (id: ${data.file?.id ?? '?'})`);
        setUploadFile(null);
        await refreshFiles(material.slug);
      }
    } catch {
      setUploadError('Сетевая ошибка. Попробуйте ещё раз.');
    } finally {
      setUploadLoading(false);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // ── Render: unauthenticated ─────────────────────────────────────────────────
  if (loadState === 'unauth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Требуется авторизация</h1>
          <p className="text-sm text-gray-500 mb-6">Войдите в аккаунт администратора, чтобы продолжить.</p>
          <Link
            href="/vhod"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  // ── Render: forbidden ───────────────────────────────────────────────────────
  if (loadState === 'forbidden') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Доступ только для администратора</h1>
          <p className="text-sm text-gray-500 mb-6">У вашего аккаунта нет прав для просмотра этой страницы.</p>
          <Link
            href="/kabinet"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            ← В кабинет
          </Link>
        </div>
      </div>
    );
  }

  // ── Render: admin UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
                М
              </div>
            </Link>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-sm font-semibold text-gray-700">Файлы материалов</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">{currentUser?.email}</span>
            <Link
              href="/kabinet"
              className="text-xs font-medium text-blue-500 hover:text-blue-600"
            >
              Кабинет →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Lookup form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Поиск материала</h2>
          </div>
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              value={slugInput}
              onChange={e => setSlugInput(e.target.value)}
              placeholder="Введите slug материала..."
              required
              disabled={lookupLoading}
              className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={lookupLoading || !slugInput.trim()}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Проверить
            </button>
          </form>
          {lookupError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {lookupError}
            </div>
          )}
        </div>

        {/* Material info */}
        {material && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 leading-snug">{material.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{material.slug}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {material.accessType}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {material.fileType ?? '—'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    material.isPublished
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {material.isPublished ? 'Опубликован' : 'Не опубликован'}
                  </span>
                </div>
              </div>
            </div>

            {/* Existing files */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Зарегистрированные файлы ({existingFiles.length})
              </p>
              {existingFiles.length === 0 ? (
                <p className="text-sm text-gray-400">Файлы ещё не зарегистрированы.</p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                  {existingFiles.map(f => (
                    <div key={f.id} className="px-4 py-3 text-sm bg-white">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          f.fileRole === 'paid' ? 'bg-amber-50 text-amber-700' :
                          f.fileRole === 'preview' ? 'bg-purple-50 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {FILE_ROLE_LABELS[f.fileRole] ?? f.fileRole}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(f.createdAt)}</span>
                        {f.fileSize && (
                          <span className="text-xs text-gray-400">{formatBytes(f.fileSize)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono break-all">{f.storageKey}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload form */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-gray-800">Загрузить файл и подключить к материалу</p>
              </div>
              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Роль файла</label>
                  <select
                    value={uploadRole}
                    onChange={e => setUploadRole(e.target.value as 'paid' | 'preview' | 'cover')}
                    disabled={uploadLoading}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60 bg-white"
                  >
                    <option value="paid">paid - основной файл для скачивания</option>
                    <option value="preview">preview - файл предпросмотра</option>
                    <option value="cover">cover - обложка</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Файл</label>
                  <input
                    key={uploadSuccess}
                    type="file"
                    onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                    disabled={uploadLoading}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600 disabled:opacity-60"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Выберите PDF, DOCX, PPT или другой рабочий файл с компьютера. Storage Key сайт создаст сам.
                  </p>
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadLoading ? 'Загрузка...' : 'Загрузить и подключить'}
                </button>
              </form>
            </div>

            {/* Registration form */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Зарегистрировать файл
              </p>
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Роль файла</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as 'paid' | 'preview' | 'cover')}
                    disabled={regLoading}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60 bg-white"
                  >
                    <option value="paid">paid — основной платный файл</option>
                    <option value="preview">preview — превью</option>
                    <option value="cover">cover — обложка</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Storage Key *</label>
                  <input
                    type="text"
                    value={regKey}
                    onChange={e => setRegKey(e.target.value)}
                    placeholder="materials/paid/example-slug.pdf"
                    required
                    disabled={regLoading}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Путь к файлу внутри бакета, например:{' '}
                    <span className="font-mono">materials/paid/slug.pdf</span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Размер файла (байты) <span className="text-gray-400 font-normal">необязательно</span>
                  </label>
                  <input
                    type="number"
                    value={regSize}
                    onChange={e => setRegSize(e.target.value)}
                    placeholder="например: 1048576"
                    min={0}
                    disabled={regLoading}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60"
                  />
                </div>
                {regError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {regError}
                  </div>
                )}
                {regSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {regSuccess}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={regLoading || !regKey.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                  Зарегистрировать файл
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
