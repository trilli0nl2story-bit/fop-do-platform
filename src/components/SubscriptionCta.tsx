import { Crown, Check } from 'lucide-react';
import { Button } from './Button';

interface SubscriptionCtaProps {
  onNavigate: (page: string) => void;
}

export function SubscriptionCta({ onNavigate }: SubscriptionCtaProps) {
  return (
    <div className="mt-12 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">Оформите подписку</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Получите доступ ко всем материалам, AI-помощнику и скидку 25% на покупки.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {['15 AI-запросов/мес', 'Премиум-библиотека', 'Скидка 25%'].map((item, i) => (
              <li key={i} className="flex items-center gap-1 text-xs text-gray-600">
                <Check className="w-3.5 h-3.5 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Button
          className="bg-amber-500 hover:bg-amber-600 flex-shrink-0"
          onClick={() => onNavigate('subscription')}
        >
          <Crown className="w-4 h-4" />
          278 ₽ / месяц
        </Button>
      </div>
    </div>
  );
}
