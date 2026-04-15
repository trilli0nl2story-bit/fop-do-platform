import { CheckCircle, Clock, XCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';

export type PaymentStateType =
  | 'payment_creating'
  | 'payment_redirecting'
  | 'payment_success_product'
  | 'payment_success_subscription'
  | 'payment_pending'
  | 'payment_failed';

interface PaymentStateProps {
  state: PaymentStateType;
  onNavigate: (page: string) => void;
  returnPage?: string;
}

export function PaymentState({ state, onNavigate, returnPage = 'store-materials' }: PaymentStateProps) {
  if (state === 'payment_creating') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Создаём оплату</h1>
          <p className="text-gray-500 text-sm">Сейчас откроется защищённая страница оплаты</p>
        </div>
      </div>
    );
  }

  if (state === 'payment_redirecting') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <ArrowRight className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Перенаправляем на оплату</h1>
          <p className="text-gray-500 text-sm">После оплаты вы вернётесь на сайт автоматически</p>
          <div className="mt-6 flex justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'payment_success_product') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Оплата прошла успешно</h1>
            <p className="text-gray-500 text-sm">Материал доступен в разделе «Мои материалы»</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full justify-center" size="lg" onClick={() => onNavigate('my-documents')}>
              Открыть мои материалы
            </Button>
            <Button variant="secondary" className="w-full justify-center" size="lg" onClick={() => onNavigate('store-materials')}>
              Вернуться в магазин
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'payment_success_subscription') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Подписка активирована</h1>
            <p className="text-gray-500 text-sm">Материалы по подписке уже доступны в вашем кабинете</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full justify-center" size="lg" onClick={() => onNavigate('subscription-materials')}>
              Перейти к материалам по подписке
            </Button>
            <Button variant="secondary" className="w-full justify-center" size="lg" onClick={() => onNavigate('profile')}>
              Открыть профиль
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'payment_pending') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="w-9 h-9 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Ожидаем подтверждение оплаты</h1>
            <p className="text-gray-500 text-sm">
              Обычно это занимает несколько секунд. Если материал не появился сразу, обновите страницу чуть позже.
            </p>
          </div>
          <div className="space-y-3">
            <Button className="w-full justify-center" size="lg" onClick={() => onNavigate('my-documents')}>
              <RefreshCw className="w-4 h-4" />
              Проверить ещё раз
            </Button>
            <Button variant="secondary" className="w-full justify-center" size="lg" onClick={() => onNavigate('dashboard')}>
              Вернуться в кабинет
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'payment_failed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Оплата не завершена</h1>
            <p className="text-gray-500 text-sm">Вы можете попробовать ещё раз или вернуться к материалу.</p>
          </div>
          <div className="space-y-3">
            <Button className="w-full justify-center" size="lg" onClick={() => onNavigate('cart')}>
              Попробовать снова
            </Button>
            <Button variant="secondary" className="w-full justify-center" size="lg" onClick={() => onNavigate(returnPage)}>
              Вернуться к материалу
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
