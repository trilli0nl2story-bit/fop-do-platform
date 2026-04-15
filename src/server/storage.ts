import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { query } from './db';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StorageFileRole = 'paid' | 'preview' | 'cover';

export interface MaterialStorageFile {
  id: string;
  materialId: string;
  fileRole: StorageFileRole;
  storageKey: string;
  fileSize: number | null;
  createdAt: string;
}

export type DownloadDescriptor =
  | { status: 'file_not_uploaded'; message: string }
  | { status: 'storage_not_configured'; message: string }
  | { status: 'ready'; url: string; expiresInSeconds: number; fileSize: number | null; message: string };

// ── S3 configuration ──────────────────────────────────────────────────────────

function getS3Env() {
  return {
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? '',
    bucket: process.env.S3_BUCKET ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    ttl: Math.max(30, parseInt(process.env.S3_SIGNED_URL_TTL_SECONDS ?? '300', 10) || 300),
  };
}

export function isStorageConfigured(): boolean {
  const e = getS3Env();
  return !!(e.endpoint && e.region && e.bucket && e.accessKeyId && e.secretAccessKey);
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Returns the most recent material_files row for the given role, or null.
 */
export async function getMaterialFile(
  materialId: string,
  role: StorageFileRole
): Promise<MaterialStorageFile | null> {
  const res = await query<{
    id: string; material_id: string; file_role: string;
    storage_key: string; file_size: number | null; created_at: string;
  }>(
    `SELECT id, material_id, file_role, storage_key, file_size, created_at
     FROM material_files
     WHERE material_id = $1 AND file_role = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [materialId, role]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    materialId: r.material_id,
    fileRole: r.file_role as StorageFileRole,
    storageKey: r.storage_key,
    fileSize: r.file_size,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

/**
 * Inserts a material_files metadata row. Does NOT upload the file.
 */
export async function registerMaterialFile(params: {
  materialId: string;
  fileRole: StorageFileRole;
  storageKey: string;
  fileSize?: number | null;
}): Promise<MaterialStorageFile> {
  const res = await query<{
    id: string; material_id: string; file_role: string;
    storage_key: string; file_size: number | null; created_at: string;
  }>(
    `INSERT INTO material_files (material_id, file_role, storage_key, file_size)
     VALUES ($1, $2, $3, $4)
     RETURNING id, material_id, file_role, storage_key, file_size, created_at`,
    [params.materialId, params.fileRole, params.storageKey, params.fileSize ?? null]
  );
  const r = res.rows[0];
  return {
    id: r.id,
    materialId: r.material_id,
    fileRole: r.file_role as StorageFileRole,
    storageKey: r.storage_key,
    fileSize: r.file_size,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// ── Signed URL generation ─────────────────────────────────────────────────────

/**
 * Returns a DownloadDescriptor for the end-user:
 *   - file_not_uploaded  : no material_files row yet
 *   - storage_not_configured : row exists but env vars absent or signing failed
 *   - ready              : short-lived signed GET URL generated successfully
 *
 * Never exposes storageKey, bucket name, or credentials to callers.
 */
export async function createDownloadDescriptor(
  file: MaterialStorageFile | null
): Promise<DownloadDescriptor> {
  if (!file) {
    return {
      status: 'file_not_uploaded',
      message: 'Файл скоро появится в личном кабинете. Доступ уже закреплён за вашим аккаунтом.',
    };
  }

  if (!isStorageConfigured()) {
    return {
      status: 'storage_not_configured',
      message: 'Файл закреплён за материалом, но хранилище ещё не подключено.',
    };
  }

  try {
    const { endpoint, region, bucket, accessKeyId, secretAccessKey, forcePathStyle, ttl } = getS3Env();

    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle,
    });

    const command = new GetObjectCommand({ Bucket: bucket, Key: file.storageKey });
    const url = await getSignedUrl(client, command, { expiresIn: ttl });

    return {
      status: 'ready',
      url,
      expiresInSeconds: ttl,
      fileSize: file.fileSize,
      message: 'Файл готов к скачиванию. Ссылка действует ограниченное время.',
    };
  } catch (err) {
    console.error('[storage] URL signing failed:', err instanceof Error ? err.message : 'unknown error');
    return {
      status: 'storage_not_configured',
      message: 'Не удалось подготовить ссылку для скачивания. Попробуйте позже.',
    };
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_ROLES: StorageFileRole[] = ['paid', 'preview', 'cover'];

export function isValidFileRole(role: unknown): role is StorageFileRole {
  return typeof role === 'string' && (VALID_ROLES as string[]).includes(role);
}
