import { query } from './db';

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  message?: string;
}

/**
 * Server-only helper. Checks whether userId has access to a published material.
 * Never trusts the client — all checks are performed against the database.
 */
export async function checkMaterialAccess(
  userId: string,
  materialId: string,
  accessType: string
): Promise<AccessResult> {

  if (accessType === 'free') {
    const res = await query(
      `SELECT 1 FROM user_materials
       WHERE user_id = $1 AND material_id = $2
         AND (expires_at IS NULL OR expires_at > now())
       LIMIT 1`,
      [userId, materialId]
    );
    if (res.rows.length === 0) {
      return {
        allowed: false,
        reason: 'no_grant',
        message: 'Сначала добавьте бесплатный материал в личный кабинет.',
      };
    }
    return { allowed: true };
  }

  if (accessType === 'store') {
    const res = await query(
      `SELECT 1 FROM user_materials
       WHERE user_id = $1 AND material_id = $2
         AND access_type IN ('purchase', 'admin_grant')
         AND (expires_at IS NULL OR expires_at > now())
       LIMIT 1`,
      [userId, materialId]
    );
    if (res.rows.length === 0) {
      return {
        allowed: false,
        reason: 'no_purchase',
        message: 'Этот материал необходимо приобрести.',
      };
    }
    return { allowed: true };
  }

  if (accessType === 'subscription') {
    // Option A: active subscription
    const subRes = await query(
      `SELECT 1 FROM subscriptions
       WHERE user_id = $1
         AND status = 'active'
         AND current_period_end > now()
       LIMIT 1`,
      [userId]
    );
    if (subRes.rows.length > 0) return { allowed: true };

    // Option B: explicit grant row
    const grantRes = await query(
      `SELECT 1 FROM user_materials
       WHERE user_id = $1 AND material_id = $2
         AND access_type IN ('subscription', 'admin_grant')
         AND (expires_at IS NULL OR expires_at > now())
       LIMIT 1`,
      [userId, materialId]
    );
    if (grantRes.rows.length > 0) return { allowed: true };

    return {
      allowed: false,
      reason: 'no_subscription',
      message: 'Для доступа к этому материалу нужна активная подписка.',
    };
  }

  return {
    allowed: false,
    reason: 'unknown_access_type',
    message: 'Доступ к материалу не определён.',
  };
}
