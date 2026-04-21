'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          theme?: 'light' | 'dark';
        }
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

interface TurnstileFieldProps {
  value: string;
  onChange: (token: string) => void;
}

export function TurnstileField({ value, onChange }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !scriptReady || !containerRef.current || !window.turnstile) {
      return;
    }

    if (widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => onChange(token),
      'expired-callback': () => onChange(''),
      'error-callback': () => onChange(''),
      theme: 'light',
    });

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onChange, scriptReady]);

  if (!SITE_KEY) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <label className="block text-xs font-semibold text-gray-600">
        Проверка от ботов
      </label>
      <div
        ref={containerRef}
        className="min-h-[65px] rounded-xl border border-gray-200 bg-gray-50 p-3"
      />
      {!value && (
        <p className="text-xs text-gray-500">
          Подтвердите, что вы не робот, чтобы завершить регистрацию.
        </p>
      )}
    </div>
  );
}

export function isTurnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}
