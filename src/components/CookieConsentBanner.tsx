'use client';

import { useEffect, useState } from 'react';
import {
  type CookieConsentState,
  getCookieConsent,
  saveCookieConsent,
} from '../lib/cookieConsent';

type ViewMode = 'compact' | 'settings';

function recordCookieConsent(state: CookieConsentState): void {
  void fetch('/api/consents/cookie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analytics: state.analytics,
      ads: state.ads,
      version: state.version,
      acceptedAt: state.acceptedAt,
    }),
  }).catch(() => {
    // Consent choice is already stored locally; server logging is best-effort.
  });
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<ViewMode>('compact');
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  function applyConsent(settings: { analytics: boolean; ads: boolean }) {
    const state = saveCookieConsent(settings);
    if (state) {
      recordCookieConsent(state);
    }
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <section
      aria-label="Настройки cookie"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.10)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-base font-semibold text-gray-900">Cookie и аналитика</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Мы используем обязательные cookie для работы сайта. Аналитические и рекламные cookie
            включаются только с вашего согласия.
          </p>
          <a href="/legal/cookie-policy" className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:underline">
            Политика cookie
          </a>

          {mode === 'settings' && (
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900">Обязательные</p>
                <p className="mt-1 text-gray-500">Нужны для входа, корзины и безопасности.</p>
                <p className="mt-2 text-xs font-medium text-green-700">Всегда включены</p>
              </div>
              <label className="rounded-lg border border-gray-200 p-3">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">Аналитика</span>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(event) => setAnalytics(event.target.checked)}
                    className="h-4 w-4"
                  />
                </span>
                <span className="mt-1 block text-gray-500">Помогает понять, какие разделы улучшать.</span>
              </label>
              <label className="rounded-lg border border-gray-200 p-3">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">Реклама</span>
                  <input
                    type="checkbox"
                    checked={ads}
                    onChange={(event) => setAds(event.target.checked)}
                    className="h-4 w-4"
                  />
                </span>
                <span className="mt-1 block text-gray-500">Для будущей настройки рекламных пикселей.</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[360px] lg:justify-end">
          {mode === 'compact' ? (
            <>
              <button
                type="button"
                onClick={() => applyConsent({ analytics: true, ads: true })}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Принять все
              </button>
              <button
                type="button"
                onClick={() => applyConsent({ analytics: false, ads: false })}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Только необходимые
              </button>
              <button
                type="button"
                onClick={() => setMode('settings')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Настроить
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => applyConsent({ analytics, ads })}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Сохранить выбор
              </button>
              <button
                type="button"
                onClick={() => applyConsent({ analytics: false, ads: false })}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Только необходимые
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
