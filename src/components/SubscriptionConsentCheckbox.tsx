import type { MouseEvent } from 'react';

interface SubscriptionConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SubscriptionConsentCheckbox({ checked, onChange }: SubscriptionConsentCheckboxProps) {
  const stopLabelToggle = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <span className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
          required
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            checked ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'
          }`}
        >
          {checked && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </span>
      <span className="text-xs leading-relaxed text-gray-600">
        Я принимаю условия{' '}
        <a
          href="/legal/oferta"
          onClick={stopLabelToggle}
          className="font-medium text-blue-600 hover:underline"
        >
          Публичной оферты
        </a>
        ,{' '}
        <a
          href="/legal/subscription"
          onClick={stopLabelToggle}
          className="font-medium text-blue-600 hover:underline"
        >
          условия подписки
        </a>
        {' '}и{' '}
        <a
          href="/legal/vozvrat"
          onClick={stopLabelToggle}
          className="font-medium text-blue-600 hover:underline"
        >
          условия возврата
        </a>
        . Я понимаю, что сейчас это разовая оплата доступа на выбранный срок без автоматических списаний.
      </span>
    </label>
  );
}
