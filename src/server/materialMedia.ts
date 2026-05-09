import type { StorageFileRole } from './storage';

type RoleRules = {
  extensions: Set<string>;
  mimeTypes: Set<string>;
  maxBytes: number;
};

const MB = 1024 * 1024;

const rulesByRole: Record<StorageFileRole, RoleRules> = {
  cover: {
    extensions: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']),
    mimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ]),
    maxBytes: 15 * MB,
  },
  preview: {
    extensions: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.pdf', '.mp4', '.webm', '.mov']),
    mimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'application/pdf',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]),
    maxBytes: 60 * MB,
  },
  paid: {
    extensions: new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.gif',
      '.avif',
      '.pdf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.xls',
      '.xlsx',
      '.txt',
      '.zip',
      '.rar',
      '.7z',
      '.mp4',
      '.webm',
      '.mov',
    ]),
    mimeTypes: new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.rar',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]),
    maxBytes: 100 * MB,
  },
};

const safeInlineTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

function normalizeExtension(fileName: string): string {
  const match = /\.[a-z0-9]+$/i.exec(fileName.trim().toLowerCase());
  return match?.[0] ?? '';
}

export function isAllowedMaterialUpload(params: {
  fileRole: StorageFileRole;
  fileName: string;
  contentType: string;
  fileSize: number;
}): { ok: true } | { ok: false; message: string } {
  const rules = rulesByRole[params.fileRole];
  const ext = normalizeExtension(params.fileName);
  const type = params.contentType.trim().toLowerCase();

  if (params.fileSize > rules.maxBytes) {
    return {
      ok: false,
      message: `Файл слишком большой для роли ${params.fileRole}.`,
    };
  }

  if (!rules.extensions.has(ext)) {
    return {
      ok: false,
      message: `Формат ${ext || 'без расширения'} не разрешён для роли ${params.fileRole}.`,
    };
  }

  if (type && !rules.mimeTypes.has(type)) {
    return {
      ok: false,
      message: `Тип файла ${type} не разрешён для роли ${params.fileRole}.`,
    };
  }

  return { ok: true };
}

export function getSafeMediaHeaders(params: {
  contentType: string;
  fileName: string;
  isPublished: boolean;
}): Record<string, string> {
  const contentType = params.contentType || 'application/octet-stream';
  const disposition = safeInlineTypes.has(contentType)
    ? `inline; filename="${encodeURIComponent(params.fileName)}"`
    : `attachment; filename="${encodeURIComponent(params.fileName)}"`;

  return {
    'Content-Type': contentType,
    'Content-Disposition': disposition,
    'Cache-Control': params.isPublished ? 'public, max-age=3600' : 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}
