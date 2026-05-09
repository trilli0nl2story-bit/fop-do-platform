'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FilePlus,
  FileText,
  Image as ImageIcon,
  Loader2,
  PlusCircle,
  Search,
  Upload,
  X,
} from 'lucide-react';
import {
  getDisplayCoverUrl,
  getPreviewPresentation,
  isYandexDiskPublicAssetUrl,
  type PreviewPresentation,
} from '@/src/lib/materialMediaLinks';

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
  coverUrl: string;
  previewText: string;
  previewFileUrl: string;
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
  coverUrl: string;
  previewText: string;
  previewFileUrl: string;
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
  all: 'Р’СЃРµ',
  store: 'РњР°РіР°Р·РёРЅ',
  free: 'Р‘РµСЃРїР»Р°С‚РЅС‹Рµ',
  subscription: 'РџРѕРґРїРёСЃРєР°',
};

const fileRoleLabels: Record<FileRole, string> = {
  paid: 'РћСЃРЅРѕРІРЅРѕР№ С„Р°Р№Р»',
  preview: 'РџСЂРµРІСЊСЋ',
  cover: 'РћР±Р»РѕР¶РєР°',
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
    coverUrl: material.coverUrl ?? '',
    previewText: material.previewText ?? '',
    previewFileUrl: material.previewFileUrl ?? '',
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
    coverUrl: '',
    previewText: '',
    previewFileUrl: '',
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

function buildSeoFields(form: MaterialForm) {
  const title = form.title.trim();
  const descriptionSource = (
    form.shortDescription ||
    form.previewText ||
    form.fullDescription ||
    title
  ).trim();

  return {
    seoTitle: title ? `${title} вЂ” РјР°С‚РµСЂРёР°Р» РґР»СЏ РїРµРґР°РіРѕРіРѕРІ` : '',
    seoDescription: descriptionSource.slice(0, 180),
  };
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
  if (!n) return 'СЂР°Р·РјРµСЂ РЅРµ СѓРєР°Р·Р°РЅ';
  if (n < 1024) return `${n} Р‘`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} РљР‘`;
  return `${(n / 1024 / 1024).toFixed(2)} РњР‘`;
}

function roleBadgeClass(role: string) {
  if (role === 'paid') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (role === 'preview') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function CoverPreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <FileText className="w-8 h-8 text-blue-200" />;
  }

  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function PreviewCard({ presentation }: { presentation: PreviewPresentation }) {
  if (presentation.kind === 'none') {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
        <ImageIcon className="mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">РџСЂРµРІСЊСЋ РїРѕРєР° РЅРµ РґРѕР±Р°РІР»РµРЅРѕ</p>
        <p className="mt-1 text-xs text-gray-400">РЎСЋРґР° РјРѕР¶РЅРѕ РїРѕРґСЃС‚Р°РІРёС‚СЊ РІРёРґРµРѕ, PDF, РёР·РѕР±СЂР°Р¶РµРЅРёРµ РёР»Рё СЃСЃС‹Р»РєСѓ РЅР° РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ.</p>
      </div>
    );
  }

  if (presentation.kind === 'embed') {
    return (
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="aspect-video bg-black">
          <iframe
            src={presentation.src}
            title="РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ РјР°С‚РµСЂРёР°Р»Р°"
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (presentation.kind === 'image') {
    return (
      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <div className="aspect-video bg-gray-50">
          <img
            src={presentation.src}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-blue-100 bg-white p-5 text-center">
      <FileText className="mb-3 h-8 w-8 text-blue-200" />
      <p className="text-sm font-medium text-gray-700">РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ РґРѕСЃС‚СѓРїРµРЅ РїРѕ СЃСЃС‹Р»РєРµ</p>
      <a
        href={presentation.href}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        РћС‚РєСЂС‹С‚СЊ РїСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ
      </a>
    </div>
  );
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
          limit: '300',
        });
        const res = await fetch(`/api/admin/materials?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°С‚РµСЂРёР°Р»С‹');
        setMaterials(data.materials ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setMaterialsError(err instanceof Error ? err.message : 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјР°С‚РµСЂРёР°Р»С‹');
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
      if (!res.ok) throw new Error(data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РјР°С‚РµСЂРёР°Р»');
      setSelectedMaterial(data.material);
      setMaterialForm(materialToForm(data.material));
      setFiles(data.files ?? []);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РјР°С‚РµСЂРёР°Р»');
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
      const seo = buildSeoFields(createForm);
      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          seoTitle: createForm.seoTitle || seo.seoTitle,
          seoDescription: createForm.seoDescription || seo.seoDescription,
          priceRubles: createForm.accessType === 'store' ? Number(createForm.priceRubles || 0) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РјР°С‚РµСЂРёР°Р»');

      setCreateSuccess('РњР°С‚РµСЂРёР°Р» СЃРѕР·РґР°РЅ. РўРµРїРµСЂСЊ РјРѕР¶РЅРѕ Р·Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р».');
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
      setCreateError(err instanceof Error ? err.message : 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РјР°С‚РµСЂРёР°Р»');
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
      const seo = buildSeoFields(materialForm);
      const res = await fetch(`/api/admin/materials/${encodeURIComponent(selectedMaterial.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...materialForm,
          seoTitle: materialForm.seoTitle || seo.seoTitle,
          seoDescription: materialForm.seoDescription || seo.seoDescription,
          priceRubles: materialForm.accessType === 'store' ? Number(materialForm.priceRubles || 0) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ');

      setSelectedMaterial(data.material);
      setMaterialForm(materialToForm(data.material));
      setStatusChangeConfirmed(false);
      setSaveSuccess('РР·РјРµРЅРµРЅРёСЏ СЃРѕС…СЂР°РЅРµРЅС‹');
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
      setSaveError(err instanceof Error ? err.message : 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ');
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
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р»');
      setUploadSuccess(`Р¤Р°Р№Р» Р·Р°РіСЂСѓР¶РµРЅ Рё РїРѕРґРєР»СЋС‡С‘РЅ Рє РјР°С‚РµСЂРёР°Р»Сѓ`);
      if (data.materialUpdate?.coverUrl || data.materialUpdate?.previewFileUrl) {
        const patch = {
          ...(data.materialUpdate.coverUrl ? { coverUrl: data.materialUpdate.coverUrl } : {}),
          ...(data.materialUpdate.previewFileUrl ? { previewFileUrl: data.materialUpdate.previewFileUrl } : {}),
        };
        setSelectedMaterial(prev => (prev ? { ...prev, ...patch } : prev));
        setMaterialForm(prev => (prev ? { ...prev, ...patch } : prev));
      }
      setUploadFile(null);
      await refreshSelectedFiles();
      setMaterials(prev => prev.map(item => (
        item.slug === selectedMaterial.slug ? { ...item, fileCount: item.fileCount + 1 } : item
      )));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р»');
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
        throw new Error('Р Р°Р·РјРµСЂ С„Р°Р№Р»Р° РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РїРѕР»РѕР¶РёС‚РµР»СЊРЅС‹Рј С‡РёСЃР»РѕРј');
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
      if (!res.ok) throw new Error(data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ С„Р°Р№Р»');
      setManualSuccess('Р¤Р°Р№Р» Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ');
      setManualKey('');
      setManualSize('');
      await refreshSelectedFiles();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ С„Р°Р№Р»');
    } finally {
      setManualLoading(false);
    }
  }

  const selectedFilesTitle = useMemo(() => {
    if (!selectedMaterial) return 'Р’С‹Р±РµСЂРёС‚Рµ РјР°С‚РµСЂРёР°Р» СЃР»РµРІР°';
    return selectedMaterial.title;
  }, [selectedMaterial]);

  const createCoverPreviewUrl = useMemo(() => getDisplayCoverUrl(createForm.coverUrl), [createForm.coverUrl]);
  const createPreviewPresentation = useMemo(
    () => getPreviewPresentation(createForm.previewFileUrl),
    [createForm.previewFileUrl]
  );
  const editCoverPreviewUrl = useMemo(
    () => getDisplayCoverUrl(materialForm?.coverUrl ?? ''),
    [materialForm?.coverUrl]
  );
  const editPreviewPresentation = useMemo(
    () => getPreviewPresentation(materialForm?.previewFileUrl ?? ''),
    [materialForm?.previewFileUrl]
  );
  const createYandexCover = isYandexDiskPublicAssetUrl(createForm.coverUrl);
  const editYandexCover = isYandexDiskPublicAssetUrl(materialForm?.coverUrl ?? '');

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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Р”РѕРєСѓРјРµРЅС‚С‹</h1>
          <p className="text-sm text-gray-500">
            Р—РґРµСЃСЊ СЃРѕР·РґР°СЋС‚СЃСЏ РјР°С‚РµСЂРёР°Р»С‹, РІС‹Р±РёСЂР°РµС‚СЃСЏ СЂР°Р·РґРµР» Рё РїРѕРґРєР»СЋС‡Р°СЋС‚СЃСЏ С„Р°Р№Р»С‹: РѕСЃРЅРѕРІРЅРѕР№ РґРѕРєСѓРјРµРЅС‚, РїСЂРµРІСЊСЋ РёР»Рё РѕР±Р»РѕР¶РєР°.
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
          РЎРѕР·РґР°С‚СЊ РјР°С‚РµСЂРёР°Р»
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
              <h2 className="text-lg font-bold text-gray-900">РќРѕРІС‹Р№ РјР°С‚РµСЂРёР°Р»</h2>
              <p className="text-sm text-gray-500 mt-1">
                Р—Р°РїРѕР»РЅРёС‚Рµ РїРѕРЅСЏС‚РЅС‹Рµ РїРѕР»СЏ. РђРґСЂРµСЃ СЃС‚СЂР°РЅРёС†С‹ СЃРѕР·РґР°СЃС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РёР· РЅР°Р·РІР°РЅРёСЏ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              aria-label="Р—Р°РєСЂС‹С‚СЊ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateMaterial} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">РќР°Р·РІР°РЅРёРµ *</label>
                <input
                  value={createForm.title}
                  onChange={e => updateCreateForm('title', e.target.value)}
                  maxLength={220}
                  required
                  placeholder="РќР°РїСЂРёРјРµСЂ: РљРѕРЅСЃРїРµРєС‚ Р·Р°РЅСЏС‚РёСЏ В«Р’РµСЃРЅР° РїСЂРёС€Р»Р°В»"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Р Р°Р·РґРµР»</label>
                <select
                  value={createForm.categoryId}
                  onChange={e => updateCreateForm('categoryId', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Р‘РµР· СЂР°Р·РґРµР»Р°</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">РџСЂРѕРіСЂР°РјРјР°</label>
                <input
                  value={createForm.program}
                  onChange={e => updateCreateForm('program', e.target.value)}
                  maxLength={160}
                  placeholder="РќР°РїСЂРёРјРµСЂ: Р¤РћРџ Р”Рћ"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">РўРёРї РґРѕСЃС‚СѓРїР°</label>
                <select
                  value={createForm.accessType}
                  onChange={e => updateCreateForm('accessType', e.target.value as MaterialForm['accessType'])}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="store">РњР°РіР°Р·РёРЅ</option>
                  <option value="free">Р‘РµСЃРїР»Р°С‚РЅС‹Р№</option>
                  <option value="subscription">РџРѕ РїРѕРґРїРёСЃРєРµ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">РўРёРї С„Р°Р№Р»Р°</label>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Р¦РµРЅР°, в‚Ѕ</label>
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
                  РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ СЃСЂР°Р·Сѓ
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={createForm.isFeatured}
                    onChange={e => updateCreateForm('isFeatured', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  РР·Р±СЂР°РЅРЅС‹Р№ РјР°С‚РµСЂРёР°Р»
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">РљРѕСЂРѕС‚РєРѕРµ РѕРїРёСЃР°РЅРёРµ</label>
                <textarea
                  value={createForm.shortDescription}
                  onChange={e => updateCreateForm('shortDescription', e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Основная картинка</label>
                <input
                  value={createForm.coverUrl}
                  onChange={e => updateCreateForm('coverUrl', e.target.value)}
                  placeholder="https://... или /images/cover.jpg"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Обложка карточки материала. Поддерживается прямая ссылка на изображение, публичная ссылка Яндекс Диска
                  и загруженный ниже файл с ролью «Обложка».
                </p>
                {createYandexCover && (
                  <p className="text-xs text-blue-600 mt-1">
                    Ссылка Яндекс Диска будет показана через наш встроенный просмотрщик, чтобы обложка не ломалась на сайте.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ссылка на превью или видео</label>
                <input
                  value={createForm.previewFileUrl}
                  onChange={e => updateCreateForm('previewFileUrl', e.target.value)}
                  placeholder="https://... видео, презентация или PDF-превью"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Можно вставить ссылку на видео, PDF-превью или iframe-код. Публичные ссылки VK Видео будут
                  открываться внутри сайта.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Текст превью</label>
                <textarea
                  value={createForm.previewText}
                  onChange={e => updateCreateForm('previewText', e.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder="Что пользователь увидит до покупки или входа в подписку"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                />
              </div>

              {(createForm.coverUrl || createForm.previewText || createForm.previewFileUrl) && (
                <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">Как это будет выглядеть</p>
                  <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
                    <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
                      <div className="aspect-[4/3] flex items-center justify-center bg-white">
                        <CoverPreview src={createCoverPreviewUrl} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="line-clamp-2 font-semibold text-gray-900">{createForm.title || 'Новый материал'}</p>
                        <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                          {createForm.previewText || createForm.shortDescription || 'Текст предпросмотра появится здесь.'}
                        </p>
                      </div>
                      <PreviewCard presentation={createPreviewPresentation} />
                    </div>
                  </div>
                </div>
              )}

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
              Р—Р°С‰РёС‚Р° РІРєР»СЋС‡РµРЅР°: slug СЃРѕР·РґР°С‘С‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё, РЅРѕРІС‹Р№ РјР°С‚РµСЂРёР°Р» РїРёС€РµС‚СЃСЏ РІ Р¶СѓСЂРЅР°Р» РёР·РјРµРЅРµРЅРёР№, С„Р°Р№Р» РјРѕР¶РЅРѕ Р·Р°РіСЂСѓР·РёС‚СЊ СЃСЂР°Р·Сѓ РїРѕСЃР»Рµ СЃРѕР·РґР°РЅРёСЏ.
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
              {createLoading ? 'РЎРѕР·РґР°РЅРёРµ...' : 'РЎРѕР·РґР°С‚СЊ РјР°С‚РµСЂРёР°Р»'}
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
                placeholder="РџРѕРёСЃРє РїРѕ РЅР°Р·РІР°РЅРёСЋ РёР»Рё slug"
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
              <div className="p-6 text-sm text-gray-400">РњР°С‚РµСЂРёР°Р»С‹ РЅРµ РЅР°Р№РґРµРЅС‹.</div>
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
                    {material.fileType ?? 'С„Р°Р№Р»'}
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
                        {selectedMaterial.fileType ?? 'С„Р°Р№Р»'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedMaterial.isPublished ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {selectedMaterial.isPublished ? 'РћРїСѓР±Р»РёРєРѕРІР°РЅ' : 'РќРµ РѕРїСѓР±Р»РёРєРѕРІР°РЅ'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      РЎР»РµРІР° РјРѕР¶РЅРѕ РЅР°Р№С‚Рё РјР°С‚РµСЂРёР°Р» РїРѕ РЅР°Р·РІР°РЅРёСЋ РёР»Рё slug Рё СЃСЂР°Р·Сѓ Р·Р°РіСЂСѓР·РёС‚СЊ Рє РЅРµРјСѓ С„Р°Р№Р».
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
                          <p className="text-sm font-semibold text-gray-900">РљР°СЂС‚РѕС‡РєР° РјР°С‚РµСЂРёР°Р»Р°</p>
                          <p className="text-xs text-gray-500 mt-1">
                            РР·РјРµРЅРµРЅРёСЏ РЅРµ СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё. Slug Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ, С‡С‚РѕР±С‹ РЅРµ СЃР»РѕРјР°С‚СЊ СЃСЃС‹Р»РєРё.
                          </p>
                        </div>
                        {hasUnsavedChanges && (
                          <span className="self-start text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                            РµСЃС‚СЊ РЅРµСЃРѕС…СЂР°РЅС‘РЅРЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">РќР°Р·РІР°РЅРёРµ *</label>
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

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Основная картинка</label>
                          <input
                            value={materialForm.coverUrl}
                            onChange={e => updateMaterialForm('coverUrl', e.target.value)}
                            placeholder="https://... или /images/cover.jpg"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Обложка карточки материала. Можно загрузить файл ниже как «Обложка» или вставить ссылку.
                          </p>
                          {editYandexCover && (
                            <p className="text-xs text-blue-600 mt-1">
                              Публичная ссылка Яндекс Диска будет показана через встроенный просмотрщик, поэтому обложка останется внутри сайта.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ссылка на превью или видео</label>
                          <input
                            value={materialForm.previewFileUrl}
                            onChange={e => updateMaterialForm('previewFileUrl', e.target.value)}
                            placeholder="https://... видео, презентация или PDF-превью"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Публичные ссылки VK Видео будут открываться прямо у нас во встроенном окне, без выброса на внешний сайт.
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Текст превью</label>
                          <textarea
                            value={materialForm.previewText}
                            onChange={e => updateMaterialForm('previewText', e.target.value)}
                            maxLength={1000}
                            rows={2}
                            placeholder="Что пользователь увидит до покупки или входа в подписку"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                          />
                        </div>

                        {(materialForm.coverUrl || materialForm.previewText || materialForm.previewFileUrl) && (
                          <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-3">Как это выглядит на сайте</p>
                            <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
                              <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
                                <div className="aspect-[4/3] flex items-center justify-center bg-white">
                                  <CoverPreview src={editCoverPreviewUrl} />
                                </div>
                              </div>
                              <div className="space-y-3 min-w-0">
                                <div>
                                  <p className="font-semibold text-gray-900 line-clamp-2">{materialForm.title || selectedMaterial.title}</p>
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                                    {materialForm.previewText || materialForm.shortDescription || 'Текст предпросмотра появится здесь.'}
                                  </p>
                                </div>
                                <PreviewCard presentation={editPreviewPresentation} />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">РџРѕР»РЅРѕРµ РѕРїРёСЃР°РЅРёРµ</label>
                          <textarea
                            value={materialForm.fullDescription}
                            onChange={e => updateMaterialForm('fullDescription', e.target.value)}
                            maxLength={5000}
                            rows={4}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">РўРёРї РґРѕСЃС‚СѓРїР°</label>
                          <select
                            value={materialForm.accessType}
                            onChange={e => updateMaterialForm('accessType', e.target.value as MaterialForm['accessType'])}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="store">РњР°РіР°Р·РёРЅ</option>
                            <option value="free">Р‘РµСЃРїР»Р°С‚РЅС‹Р№</option>
                            <option value="subscription">РџРѕ РїРѕРґРїРёСЃРєРµ</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">РўРёРї С„Р°Р№Р»Р°</label>
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
                          <label className="block text-xs font-medium text-gray-600 mb-1">Р¦РµРЅР°, в‚Ѕ</label>
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
                            <p className="text-xs text-gray-400 mt-1">Р”Р»СЏ Р±РµСЃРїР»Р°С‚РЅС‹С… Рё РїРѕРґРїРёСЃРѕС‡РЅС‹С… РјР°С‚РµСЂРёР°Р»РѕРІ С†РµРЅР° РІСЃРµРіРґР° 0 в‚Ѕ.</p>
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
                            РћРїСѓР±Р»РёРєРѕРІР°РЅ РЅР° СЃР°Р№С‚Рµ
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={materialForm.isFeatured}
                              onChange={e => updateMaterialForm('isFeatured', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            РР·Р±СЂР°РЅРЅС‹Р№ РјР°С‚РµСЂРёР°Р»
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SEO-Р·Р°РіРѕР»РѕРІРѕРє</label>
                          <button
                            type="button"
                            onClick={() => {
                              const seo = buildSeoFields(materialForm);
                              setMaterialForm(prev => (prev ? { ...prev, ...seo } : prev));
                              setSaveError('');
                              setSaveSuccess('');
                            }}
                            className="mb-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Р—Р°РїРѕР»РЅРёС‚СЊ SEO Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё
                          </button>
                          <input
                            value={materialForm.seoTitle}
                            onChange={e => updateMaterialForm('seoTitle', e.target.value)}
                            maxLength={220}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SEO-РѕРїРёСЃР°РЅРёРµ</label>
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
                            РЇ РїРѕРЅРёРјР°СЋ, С‡С‚Рѕ РјРµРЅСЏСЋ РІРёРґРёРјРѕСЃС‚СЊ РјР°С‚РµСЂРёР°Р»Р° РЅР° СЃР°Р№С‚Рµ.
                          </span>
                        </label>
                      )}

                      <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs text-green-800">
                        Р—Р°С‰РёС‚Р° РІРєР»СЋС‡РµРЅР°: СЃРѕС…СЂР°РЅСЏРµС‚ С‚РѕР»СЊРєРѕ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ, slug РЅРµР»СЊР·СЏ СЃР»СѓС‡Р°Р№РЅРѕ РёР·РјРµРЅРёС‚СЊ, РєР°Р¶РґРѕРµ СЃРѕС…СЂР°РЅРµРЅРёРµ РїРёС€РµС‚СЃСЏ РІ Р¶СѓСЂРЅР°Р» РёР·РјРµРЅРµРЅРёР№.
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
                        {saveLoading ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ'}
                      </button>
                    </form>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      РџРѕРґРєР»СЋС‡С‘РЅРЅС‹Рµ С„Р°Р№Р»С‹ ({files.length})
                    </p>
                    {files.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-400">
                        РЈ СЌС‚РѕРіРѕ РјР°С‚РµСЂРёР°Р»Р° РїРѕРєР° РЅРµС‚ С„Р°Р№Р»РѕРІ.
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
                      <p className="text-sm font-semibold text-gray-800">Р—Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р»</p>
                    </div>
                    <form onSubmit={handleUpload} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">РўРёРї С„Р°Р№Р»Р°</label>
                        <select
                          value={uploadRole}
                          onChange={e => setUploadRole(e.target.value as FileRole)}
                          disabled={uploadLoading}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                        >
                          <option value="paid">РћСЃРЅРѕРІРЅРѕР№ С„Р°Р№Р» РґР»СЏ СЃРєР°С‡РёРІР°РЅРёСЏ</option>
                          <option value="preview">РџСЂРµРІСЊСЋ РґР»СЏ РїСЂРѕСЃРјРѕС‚СЂР°</option>
                          <option value="cover">РћР±Р»РѕР¶РєР°</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Р¤Р°Р№Р» СЃ РєРѕРјРїСЊСЋС‚РµСЂР°</label>
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
                        {uploadLoading ? 'Р—Р°РіСЂСѓР·РєР°...' : 'Р—Р°РіСЂСѓР·РёС‚СЊ Рё РїРѕРґРєР»СЋС‡РёС‚СЊ'}
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
                      РџРѕРґРєР»СЋС‡РёС‚СЊ С„Р°Р№Р» РїРѕ Р°РґСЂРµСЃСѓ
                    </button>
                    {manualOpen && (
                      <form onSubmit={handleManualRegister} className="mt-3 space-y-3">
                        <select
                          value={manualRole}
                          onChange={e => setManualRole(e.target.value as FileRole)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                        >
                          <option value="paid">РћСЃРЅРѕРІРЅРѕР№ С„Р°Р№Р»</option>
                          <option value="preview">РџСЂРµРІСЊСЋ</option>
                          <option value="cover">РћР±Р»РѕР¶РєР°</option>
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
                          placeholder="Р Р°Р·РјРµСЂ С„Р°Р№Р»Р° РІ Р±Р°Р№С‚Р°С…, РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ"
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
                          РџРѕРґРєР»СЋС‡РёС‚СЊ
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
