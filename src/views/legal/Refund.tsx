import { LegalPage } from './LegalPage';

interface RefundProps {
  onNavigate: (page: string) => void;
}

export function Refund({ onNavigate }: RefundProps) {
  return (
    <LegalPage title="Оплата и возврат" onNavigate={onNavigate}>
      <h2 className="text-xl font-semibold text-gray-900 mb-3">Оплата</h2>
      <p className="text-gray-700 mb-6">
        Оплата материалов производится через подключённые платёжные системы.
        После оплаты пользователь получает доступ к материалу в личном кабинете.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Возврат</h2>
      <p className="text-gray-700 mb-4">
        Цифровые материалы считаются оказанной услугой после предоставления доступа.
      </p>
      <p className="text-gray-700">
        Возврат возможен только в случае технической ошибки или отсутствия доступа к материалу.
      </p>
    </LegalPage>
  );
}
