import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';
import {
  createMaterialStorageKey,
  isStorageConfigured,
  isValidFileRole,
  registerMaterialFileBlob,
  registerMaterialFile,
  uploadMaterialFile,
} from '@/src/server/storage';
import {
  consumeRequestRateLimit,
  rateLimitResponse,
  requireTrustedOrigin,
} from '@/src/server/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!user.isAdmin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, error: null };
}

function getFormString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'arrayBuffer' in value &&
    'name' in value &&
    'size' in value
  );
}

export async function POST(request: Request) {
  try {
    const originError = requireTrustedOrigin(request);
    if (originError) return originError;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const rate = await consumeRequestRateLimit(request, {
      scope: 'admin-material-upload',
      limit: 12,
      windowSeconds: 10 * 60,
      keyParts: [user!.id],
    });
    if (!rate.allowed) {
      return rateLimitResponse(
        rate,
        'Слишком много загрузок файлов. Подождите немного и попробуйте ещё раз.'
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
    }

    const materialSlug = getFormString(form, 'materialSlug');
    const fileRole = getFormString(form, 'fileRole');
    const explicitStorageKey = getFormString(form, 'storageKey');
    const file = form.get('file');

    if (!materialSlug) {
      return NextResponse.json({ error: 'materialSlug is required' }, { status: 400 });
    }
    if (!isValidFileRole(fileRole)) {
      return NextResponse.json({ error: 'fileRole must be one of: paid, preview, cover' }, { status: 400 });
    }
    if (!isUploadFile(file) || file.size <= 0) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'file is too large' }, { status: 413 });
    }

    const matResult = await query<{ id: string; slug: string }>(
      `SELECT id, slug FROM materials WHERE slug = $1 LIMIT 1`,
      [materialSlug]
    );

    if (matResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const material = matResult.rows[0];
    const storageKey = explicitStorageKey || createMaterialStorageKey({
      materialSlug: material.slug,
      fileRole,
      originalFilename: file.name,
    });

    const body = new Uint8Array(await file.arrayBuffer());

    let created;
    if (isStorageConfigured()) {
      await uploadMaterialFile({
        storageKey,
        body,
        contentType: file.type || 'application/octet-stream',
      });

      created = await registerMaterialFile({
        materialId: material.id,
        fileRole,
        storageKey,
        fileSize: file.size,
      });
    } else {
      created = await registerMaterialFile({
        materialId: material.id,
        fileRole,
        storageKey: `database/${storageKey}`,
        fileSize: file.size,
      });
      await registerMaterialFileBlob({
        materialFileId: created.id,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        body,
      });
    }

    let materialUpdate: { coverUrl?: string; previewFileUrl?: string } = {};
    if (fileRole === 'cover' || fileRole === 'preview') {
      const mediaUrl = `/api/materials/media/${created.id}`;
      if (fileRole === 'cover') {
        await query(
          `UPDATE materials SET cover_url = $2, updated_at = now() WHERE id = $1`,
          [material.id, mediaUrl]
        );
        materialUpdate = { coverUrl: mediaUrl };
      } else {
        await query(
          `UPDATE materials SET preview_file_url = $2, updated_at = now() WHERE id = $1`,
          [material.id, mediaUrl]
        );
        materialUpdate = { previewFileUrl: mediaUrl };
      }
    }

    return NextResponse.json({
      ok: true,
      storage: isStorageConfigured() ? 's3' : 'database',
      file: created,
      materialUpdate,
    }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/material-files/upload]', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      {
        error: 'upload_failed',
        message: 'Не удалось загрузить файл. Проверьте настройки хранилища и попробуйте ещё раз.',
      },
      { status: 500 }
    );
  }
}
