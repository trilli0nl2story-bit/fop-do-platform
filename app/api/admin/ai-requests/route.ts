import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/server/auth';
import { query } from '@/src/server/db';

export const dynamic = 'force-dynamic';

type SummaryRow = {
  completed_count: string;
  failed_count: string;
  pending_count: string;
  total_tokens: string | null;
};

type ItemRow = {
  id: string;
  user_email: string;
  status: string;
  model: string;
  prompt: string;
  response: string | null;
  tokens_used: number | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() ?? '';
    const status = url.searchParams.get('status')?.trim() ?? '';

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(
        u.email ILIKE $${params.length}
        OR r.prompt ILIKE $${params.length}
        OR COALESCE(r.response, '') ILIKE $${params.length}
      )`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [summaryRes, itemsRes] = await Promise.all([
      query<SummaryRow>(
        `
          SELECT
            COUNT(*) FILTER (WHERE status = 'completed')::text AS completed_count,
            COUNT(*) FILTER (WHERE status = 'failed')::text AS failed_count,
            COUNT(*) FILTER (WHERE status = 'pending')::text AS pending_count,
            COALESCE(SUM(tokens_used), 0)::text AS total_tokens
          FROM ai_requests
        `
      ),
      query<ItemRow>(
        `
          SELECT
            r.id,
            u.email AS user_email,
            r.status,
            r.model,
            r.prompt,
            r.response,
            r.tokens_used,
            r.error,
            r.created_at,
            r.completed_at
          FROM ai_requests r
          LEFT JOIN users u ON u.id = r.user_id
          ${whereSql}
          ORDER BY r.created_at DESC
          LIMIT 100
        `,
        params
      ),
    ]);

    const summary = summaryRes.rows[0];

    return NextResponse.json({
      summary: {
        completedCount: Number(summary?.completed_count ?? '0'),
        failedCount: Number(summary?.failed_count ?? '0'),
        pendingCount: Number(summary?.pending_count ?? '0'),
        totalTokens: Number(summary?.total_tokens ?? '0'),
      },
      items: itemsRes.rows.map((row) => ({
        id: row.id,
        userEmail: row.user_email,
        status: row.status,
        model: row.model,
        prompt: row.prompt,
        response: row.response,
        tokensUsed: row.tokens_used,
        error: row.error,
        createdAt: new Date(row.created_at).toISOString(),
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error('[api/admin/ai-requests]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
