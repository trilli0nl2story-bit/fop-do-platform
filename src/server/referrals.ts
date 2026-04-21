import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query } from './db';

const DEFAULT_REFERRAL_DISCOUNT_PERCENT = 5;
const MAX_REFERRAL_DISCOUNT_PERCENT = 35;

let referralTablesReady: Promise<void> | null = null;

type ReferralProfileRow = {
  user_id: string;
  referral_code: string;
  discount_pct: number | string;
};

type ReferralClaimRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  discount_pct: number | string;
  status: string;
  order_id: string | null;
  updated_at: string;
};

export interface ReferralDiscountResolution {
  code: string | null;
  requestedPercent: number;
  referrerId: string | null;
  message: string | null;
}

export interface ReferralSummary {
  code: string;
  discountPercent: number;
  registeredCount: number;
  paidCount: number;
  linkPath: string;
  recentInvites: Array<{
    id: string;
    email: string;
    status: string;
    updatedAt: string;
  }>;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function sanitizeEmailLocalPart(email: string): string {
  const local = email.split('@')[0] ?? 'pedagog';
  return local.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PEDAGO';
}

function clampDiscountPercent(value: number): number {
  return Math.max(0, Math.min(MAX_REFERRAL_DISCOUNT_PERCENT, Math.round(value)));
}

async function withDb<T>(
  client: PoolClient | null | undefined,
  callback: (db: Pick<PoolClient, 'query'>) => Promise<T>
): Promise<T> {
  if (client) {
    return callback(client);
  }

  return callback({ query } as unknown as Pick<PoolClient, 'query'>);
}

export async function ensureReferralTables(): Promise<void> {
  if (!referralTablesReady) {
    referralTablesReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS referral_profiles (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          referral_code text NOT NULL UNIQUE,
          discount_pct integer NOT NULL DEFAULT 5 CHECK (discount_pct >= 0 AND discount_pct <= 35),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS referral_claims (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          referred_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          referral_code text NOT NULL REFERENCES referral_profiles(referral_code) ON DELETE RESTRICT,
          order_id uuid UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
          discount_pct integer NOT NULL DEFAULT 5 CHECK (discount_pct >= 0 AND discount_pct <= 35),
          status text NOT NULL DEFAULT 'registered'
            CHECK (status IN ('registered', 'paid', 'cancelled')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS referral_claims_referrer_idx
        ON referral_claims (referrer_id, status, updated_at DESC)
      `);
    })().catch((error) => {
      referralTablesReady = null;
      throw error;
    });
  }

  await referralTablesReady;
}

async function findProfileByCode(
  code: string
): Promise<ReferralProfileRow | null> {
  await ensureReferralTables();

  const result = await query<ReferralProfileRow>(
    `
      SELECT user_id, referral_code, discount_pct
      FROM referral_profiles
      WHERE lower(referral_code) = lower($1)
      LIMIT 1
    `,
    [normalizeCode(code)]
  );

  return result.rows[0] ?? null;
}

async function getExistingClaim(referredUserId: string): Promise<ReferralClaimRow | null> {
  await ensureReferralTables();

  const result = await query<ReferralClaimRow>(
    `
      SELECT id, referrer_id, referred_id, referral_code, discount_pct, status, order_id, updated_at
      FROM referral_claims
      WHERE referred_id = $1
      LIMIT 1
    `,
    [referredUserId]
  );

  return result.rows[0] ?? null;
}

async function generateUniqueCode(email: string): Promise<string> {
  const base = sanitizeEmailLocalPart(email);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    const candidate = `${base}${suffix}`.slice(0, 12);
    const existing = await query<{ referral_code: string }>(
      `
        SELECT referral_code
        FROM referral_profiles
        WHERE referral_code = $1
        LIMIT 1
      `,
      [candidate]
    );

    if (existing.rows.length === 0) {
      return candidate;
    }
  }

  return `${base}${Date.now().toString(36).toUpperCase()}`.slice(0, 12);
}

export async function ensureUserReferralProfile(
  userId: string,
  email: string,
  client?: PoolClient | null
): Promise<{ code: string; discountPercent: number }> {
  await ensureReferralTables();

  const existing = await withDb(client, (db) =>
    db.query<ReferralProfileRow>(
      `
        SELECT user_id, referral_code, discount_pct
        FROM referral_profiles
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    )
  );

  const row = existing.rows[0];
  if (row) {
    return {
      code: row.referral_code,
      discountPercent: clampDiscountPercent(Number(row.discount_pct ?? DEFAULT_REFERRAL_DISCOUNT_PERCENT)),
    };
  }

  const candidate = await generateUniqueCode(email);
  const inserted = await withDb(client, (db) =>
    db.query<ReferralProfileRow>(
      `
        INSERT INTO referral_profiles (user_id, referral_code, discount_pct, created_at, updated_at)
        VALUES ($1, $2, $3, now(), now())
        ON CONFLICT (user_id)
        DO UPDATE SET updated_at = now()
        RETURNING user_id, referral_code, discount_pct
      `,
      [userId, candidate, DEFAULT_REFERRAL_DISCOUNT_PERCENT]
    )
  );

  const insertedRow = inserted.rows[0];
  return {
    code: insertedRow.referral_code,
    discountPercent: clampDiscountPercent(Number(insertedRow.discount_pct ?? DEFAULT_REFERRAL_DISCOUNT_PERCENT)),
  };
}

export async function resolveReferralDiscountForUser(
  referralCode: string | null | undefined,
  userId: string | null | undefined,
  hasPaidOrders: boolean
): Promise<ReferralDiscountResolution> {
  const normalizedCode = referralCode?.trim() ?? '';
  if (!normalizedCode) {
    return { code: null, requestedPercent: 0, referrerId: null, message: null };
  }

  const profile = await findProfileByCode(normalizedCode);
  if (!profile) {
    return {
      code: normalizeCode(normalizedCode),
      requestedPercent: 0,
      referrerId: null,
      message: 'Реферальный код не найден.',
    };
  }

  if (userId && profile.user_id === userId) {
    return {
      code: profile.referral_code,
      requestedPercent: 0,
      referrerId: profile.user_id,
      message: 'Нельзя применить собственный реферальный код.',
    };
  }

  if (userId) {
    const existingClaim = await getExistingClaim(userId);
    if (existingClaim && existingClaim.referral_code !== profile.referral_code) {
      return {
        code: profile.referral_code,
        requestedPercent: 0,
        referrerId: profile.user_id,
        message: 'У вас уже закреплён другой реферальный код.',
      };
    }
  }

  if (userId && hasPaidOrders) {
    return {
      code: profile.referral_code,
      requestedPercent: 0,
      referrerId: profile.user_id,
      message: 'Реферальная скидка действует только на первый оплаченный заказ.',
    };
  }

  return {
    code: profile.referral_code,
    requestedPercent: clampDiscountPercent(Number(profile.discount_pct ?? DEFAULT_REFERRAL_DISCOUNT_PERCENT)),
    referrerId: profile.user_id,
    message: 'Реферальная скидка будет применена к первому оплаченному заказу.',
  };
}

export async function claimReferralForOrder(params: {
  referredUserId: string;
  referralCode: string;
  client?: PoolClient | null;
}): Promise<void> {
  await ensureReferralTables();

  const profile = await findProfileByCode(params.referralCode);
  if (!profile || profile.user_id === params.referredUserId) {
    return;
  }

  await withDb(params.client, (db) =>
    db.query(
      `
        INSERT INTO referral_claims (
          referrer_id,
          referred_id,
          referral_code,
          discount_pct,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, 'registered', now(), now())
        ON CONFLICT (referred_id)
        DO UPDATE SET
          referral_code = EXCLUDED.referral_code,
          referrer_id = EXCLUDED.referrer_id,
          discount_pct = EXCLUDED.discount_pct,
          updated_at = now()
        WHERE referral_claims.order_id IS NULL
      `,
      [
        profile.user_id,
        params.referredUserId,
        profile.referral_code,
        clampDiscountPercent(Number(profile.discount_pct ?? DEFAULT_REFERRAL_DISCOUNT_PERCENT)),
      ]
    )
  );
}

export async function markReferralClaimPaid(params: {
  orderId: string;
  referredUserId: string;
  referralCode: string;
  client?: PoolClient | null;
}): Promise<void> {
  await ensureReferralTables();

  await withDb(params.client, (db) =>
    db.query(
      `
        UPDATE referral_claims
        SET status = 'paid',
            order_id = $1,
            updated_at = now()
        WHERE referred_id = $2
          AND lower(referral_code) = lower($3)
      `,
      [params.orderId, params.referredUserId, normalizeCode(params.referralCode)]
    )
  );
}

export async function getReferralSummary(
  userId: string,
  email: string
): Promise<ReferralSummary> {
  await ensureReferralTables();

  const profile = await ensureUserReferralProfile(userId, email);

  const [statsResult, invitesResult] = await Promise.all([
    query<{
      registered_count: string;
      paid_count: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS registered_count,
          COUNT(*) FILTER (WHERE status = 'paid')::text AS paid_count
        FROM referral_claims
        WHERE referrer_id = $1
      `,
      [userId]
    ),
    query<{
      id: string;
      email: string;
      status: string;
      updated_at: string;
    }>(
      `
        SELECT rc.id, u.email, rc.status, rc.updated_at
        FROM referral_claims rc
        JOIN users u ON u.id = rc.referred_id
        WHERE rc.referrer_id = $1
        ORDER BY rc.updated_at DESC
        LIMIT 5
      `,
      [userId]
    ),
  ]);

  return {
    code: profile.code,
    discountPercent: profile.discountPercent,
    registeredCount: Number(statsResult.rows[0]?.registered_count ?? '0'),
    paidCount: Number(statsResult.rows[0]?.paid_count ?? '0'),
    linkPath: `/?ref=${profile.code}`,
    recentInvites: invitesResult.rows.map((row) => ({
      id: row.id,
      email: row.email,
      status: row.status,
      updatedAt: new Date(row.updated_at).toISOString(),
    })),
  };
}
