import type { MouseEvent } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface AiSafetyNoticeProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AiSafetyNotice({ checked, onChange }: AiSafetyNoticeProps) {
  const stopLabelToggle = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="space-y-2">
          <p className="font-semibold">Перед запросом к AI-помощнику</p>
          <p>
            Не вводите ФИО, фотографии, телефоны, адреса, медицинские сведения и иные персональные данные детей,
            родителей, сотрудников ДОУ и третьих лиц. Используйте обезличенные формулировки: «ребенок 5 лет»,
            «группа 4-5 лет», «ребенок с ТНР» без имени и фото.
          </p>
          <p>
            Ответы AI-помощника носят справочный характер и не являются юридической, медицинской или официальной
            методической экспертизой. Перед применением пользователь самостоятельно проверяет ответ.
          </p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-white/70 p-3">
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
              checked ? 'border-amber-600 bg-amber-600' : 'border-amber-300 bg-white'
            }`}
          >
            {checked && <ShieldCheck className="h-3.5 w-3.5 text-white" />}
          </span>
        </span>
        <span className="text-xs leading-relaxed text-amber-950">
          Я понимаю правила безопасного использования AI-помощника и принимаю{' '}
          <a
            href="/legal/ai-rules"
            onClick={stopLabelToggle}
            className="font-semibold text-blue-700 hover:underline"
          >
            правила AI-помощника
          </a>
          .
        </span>
      </label>
    </div>
  );
}
