import { getClientIp } from './security';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface CaptchaVerificationResult {
  ok: boolean;
  message?: string;
  skipped?: boolean;
}

export function isCaptchaConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      process.env.TURNSTILE_SECRET_KEY
  );
}

export async function verifyCaptchaToken(
  request: Request,
  token: unknown
): Promise<CaptchaVerificationResult> {
  if (!isCaptchaConfigured()) {
    return { ok: true, skipped: true };
  }

  if (typeof token !== 'string' || !token.trim()) {
    return {
      ok: false,
      message: 'Подтвердите, что вы не робот.',
    };
  }

  try {
    const body = new URLSearchParams();
    body.set('secret', process.env.TURNSTILE_SECRET_KEY ?? '');
    body.set('response', token.trim());
    const remoteIp = getClientIp(request);
    if (remoteIp && remoteIp !== 'unknown') {
      body.set('remoteip', remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });

    const data = (await response.json().catch(() => null)) as
      | { success?: boolean }
      | null;

    if (!response.ok || data?.success !== true) {
      return {
        ok: false,
        message: 'Не удалось пройти проверку. Попробуйте ещё раз.',
      };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      '[captcha] verification failed',
      error instanceof Error ? error.message : String(error)
    );
    return {
      ok: false,
      message: 'Проверка временно недоступна. Попробуйте чуть позже.',
    };
  }
}
