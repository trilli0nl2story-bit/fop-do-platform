import type { MouseEvent } from 'react';

interface RegistrationConsentFieldsProps {
  personalDataConsent: boolean;
  termsConsent: boolean;
  marketingConsent: boolean;
  onPersonalDataChange: (checked: boolean) => void;
  onTermsChange: (checked: boolean) => void;
  onMarketingChange: (checked: boolean) => void;
  onNavigate?: (page: string) => void;
}

interface ConsentLineProps {
  checked: boolean;
  required?: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

function ConsentLine({ checked, required, onChange, children }: ConsentLineProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
          required={required}
        />
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            checked
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300 group-hover:border-blue-400 bg-white'
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-gray-600 leading-relaxed">{children}</span>
    </label>
  );
}

export function RegistrationConsentFields({
  personalDataConsent,
  termsConsent,
  marketingConsent,
  onPersonalDataChange,
  onTermsChange,
  onMarketingChange,
  onNavigate,
}: RegistrationConsentFieldsProps) {
  const handleLink = (page: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(page);
  };

  return (
    <div className="space-y-3">
      <ConsentLine checked={personalDataConsent} onChange={onPersonalDataChange} required>
        Я даю согласие на{' '}
        <a
          href="/legal/soglasie"
          onClick={handleLink('consent')}
          className="text-blue-500 hover:underline"
        >
          обработку персональных данных
        </a>{' '}
        в соответствии с{' '}
        <a
          href="/legal/konfidentsialnost"
          onClick={handleLink('privacy')}
          className="text-blue-500 hover:underline"
        >
          Политикой обработки персональных данных
        </a>
        .
      </ConsentLine>

      <ConsentLine checked={termsConsent} onChange={onTermsChange} required>
        Я принимаю{' '}
        <a
          href="/legal/usloviya"
          onClick={handleLink('terms')}
          className="text-blue-500 hover:underline"
        >
          Пользовательское соглашение
        </a>
        .
      </ConsentLine>

      <ConsentLine checked={marketingConsent} onChange={onMarketingChange}>
        Я согласен(на) получать информационные и рекламные сообщения о материалах,
        подписке, акциях и новостях проекта по условиям{' '}
        <a
          href="/legal/marketing-consent"
          onClick={handleLink('marketing-consent')}
          className="text-blue-500 hover:underline"
        >
          согласия на рассылку
        </a>
        . Я могу отказаться от рассылки в любой момент.
      </ConsentLine>
    </div>
  );
}
