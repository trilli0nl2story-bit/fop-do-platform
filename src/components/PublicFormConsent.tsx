import Link from 'next/link';

interface PublicFormConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentClassName?: string;
}

export function PublicFormConsent({
  checked,
  onChange,
  accentClassName = 'text-teal-600',
}: PublicFormConsentProps) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
      />
      <span>
        Я согласен на обработку персональных данных и понимаю, что данные из формы будут
        сохранены в системе для обратной связи и обработки моего запроса. Подробнее:{' '}
        <Link href="/legal/soglasie" className={`font-medium underline underline-offset-2 ${accentClassName}`}>
          согласие
        </Link>{' '}
        и{' '}
        <Link href="/legal/konfidentsialnost" className={`font-medium underline underline-offset-2 ${accentClassName}`}>
          политика конфиденциальности
        </Link>
        .
      </span>
    </label>
  );
}
