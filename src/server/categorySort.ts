import type { PoolClient } from 'pg';

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_visible: boolean;
  sort_order: number | string;
};

export function categoryToPublic(row: CategoryRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isVisible: row.is_visible,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function normalizeCategorySortOrders(client: PoolClient) {
  await client.query(`
    WITH ordered AS (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY sort_order ASC, name ASC, id ASC) AS next_order
      FROM categories
    )
    UPDATE categories AS c
    SET sort_order = ordered.next_order
    FROM ordered
    WHERE ordered.id = c.id
      AND c.sort_order IS DISTINCT FROM ordered.next_order
  `);
}

export async function clampCategorySortOrder(client: PoolClient, requested: number, includeNewSlot: boolean) {
  const result = await client.query<{ count: string }>('SELECT COUNT(*)::int AS count FROM categories');
  const total = Number(result.rows[0]?.count ?? 0);
  const maxPosition = includeNewSlot ? total + 1 : Math.max(total, 1);
  return Math.min(Math.max(Math.trunc(requested) || 1, 1), maxPosition);
}
