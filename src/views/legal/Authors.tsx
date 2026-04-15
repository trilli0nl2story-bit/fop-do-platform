import { LegalPage } from './LegalPage';

interface AuthorsProps {
  onNavigate: (page: string) => void;
}

export function Authors({ onNavigate }: AuthorsProps) {
  return (
    <LegalPage title="Условия размещения материалов авторами" onNavigate={onNavigate}>
      <p className="text-gray-700 mb-6">
        Авторы могут размещать свои материалы на платформе.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Требования к автору</h2>
      <p className="text-gray-700 mb-2">Автор подтверждает, что:</p>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
        <li>материал создан им лично,</li>
        <li>не нарушает авторские права третьих лиц.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Модерация</h2>
      <p className="text-gray-700 mb-6">
        Материалы проходят модерацию перед публикацией.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Вознаграждение</h2>
      <p className="text-gray-700 mb-2">Размер вознаграждения автора зависит от:</p>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
        <li>количества документов,</li>
        <li>количества продаж.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Требования для выплат</h2>
      <p className="text-gray-700 mb-2">Для получения выплат автор должен иметь статус:</p>
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        <li>самозанятый, или</li>
        <li>индивидуальный предприниматель (ИП).</li>
      </ul>
    </LegalPage>
  );
}
