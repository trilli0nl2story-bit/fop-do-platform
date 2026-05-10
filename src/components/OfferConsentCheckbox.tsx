import type { MouseEvent } from 'react';

interface OfferConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onNavigate?: (page: string) => void;
}

export function OfferConsentCheckbox({ checked, onChange, onNavigate }: OfferConsentCheckboxProps) {
  const handleLink = (page: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(page);
  };

  return (
    <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
          required
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
      <span className="text-xs leading-relaxed text-gray-600">
        Я принимаю условия{' '}
        <a
          href="/legal/oferta"
          onClick={handleLink('offer')}
          className="font-medium text-blue-600 hover:underline"
        >
          Публичной оферты
        </a>
        , условия предоставления цифровых материалов и{' '}
        <a
          href="/legal/vozvrat"
          onClick={handleLink('refund')}
          className="font-medium text-blue-600 hover:underline"
        >
          условия возврата
        </a>
        . Я понимаю, что после подтверждения оплаты доступ к цифровому материалу откроется в личном кабинете.
      </span>
    </label>
  );
}
