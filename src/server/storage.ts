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

export interface DownloadDescriptor {
  status: 'file_not_uploaded' | 'storage_not_configured';
  message: string;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Returns the first material_files row for the given role, or null if none exists.
 * Never returns storageKey to callers outside this module — callers may choose
 * to include or exclude it depending on their context (admin vs end-user).
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
 * Inserts a material_files row and returns the created record.
 * Does NOT upload anything to storage — only registers the metadata.
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

/**
 * Produces a safe placeholder descriptor — never generates a real signed URL.
 * When a real storage provider is connected, this function will be updated to
 * return a short-lived signed URL instead.
 */
export function createDownloadDescriptor(file: MaterialStorageFile | null): DownloadDescriptor {
  if (!file) {
    return {
      status: 'file_not_uploaded',
      message: 'Файл скоро появится в личном кабинете. Доступ уже закреплён за вашим аккаунтом.',
    };
  }
  // File is registered but no storage provider is connected yet
  return {
    status: 'storage_not_configured',
    message: 'Файл закреплён за материалом, но хранилище ещё не подключено.',
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_ROLES: StorageFileRole[] = ['paid', 'preview', 'cover'];

export function isValidFileRole(role: unknown): role is StorageFileRole {
  return typeof role === 'string' && (VALID_ROLES as string[]).includes(role);
}
