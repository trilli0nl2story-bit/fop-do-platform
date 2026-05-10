'use client';

import { openCookieConsentSettings } from '../lib/cookieConsent';

interface CookieSettingsButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function CookieSettingsButton({
  className = 'text-gray-400 hover:text-white transition-colors',
  children = 'Настройки cookie',
}: CookieSettingsButtonProps) {
  return (
    <button type="button" onClick={openCookieConsentSettings} className={className}>
      {children}
    </button>
  );
}
