export const COOKIE_CONSENT_VERSION = '2026-05';
export const COOKIE_CONSENT_STORAGE_KEY = 'dnl_cookie_consent';

export interface CookieConsentState {
  necessary: true;
  analytics: boolean;
  ads: boolean;
  version: string;
  acceptedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getCookieConsent(): CookieConsentState | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed.version !== COOKIE_CONSENT_VERSION || parsed.necessary !== true) {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics === true,
      ads: parsed.ads === true,
      version: COOKIE_CONSENT_VERSION,
      acceptedAt: typeof parsed.acceptedAt === 'string' ? parsed.acceptedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(settings: { analytics: boolean; ads: boolean }): CookieConsentState | null {
  if (!canUseStorage()) {
    return null;
  }

  const state: CookieConsentState = {
    necessary: true,
    analytics: settings.analytics,
    ads: settings.ads,
    version: COOKIE_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('dnl-cookie-consent-updated', { detail: state }));
    return state;
  } catch {
    return null;
  }
}

export function hasAnalyticsCookieConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}
