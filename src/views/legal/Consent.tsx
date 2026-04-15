import { LegalPage } from './LegalPage';

interface ConsentProps {
  onNavigate: (page: string) => void;
}

export function Consent({ onNavigate }: ConsentProps) {
  return (
    <LegalPage title="Согласие на обработку персональных данных" onNavigate={onNavigate}>
      <p className="text-gray-700 mb-6">
        Регистрируясь на сайте fop-do.ru, пользователь даёт согласие на обработку персональных данных.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Обрабатываемые данные</h2>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
        <li>имя,</li>
        <li>email,</li>
        <li>телефон,</li>
        <li>данные аккаунта.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Цели обработки</h2>
      <p className="text-gray-700 mb-2">Данные используются для:</p>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
        <li>регистрации,</li>
        <li>предоставления доступа к сервису,</li>
        <li>обработки заказов.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Отзыв согласия</h2>
      <p className="text-gray-700">
        Пользователь может отозвать согласие, написав на email:{' '}
        <a href="mailto:official@doshkolnoe-na-lokanichnom.ru" className="text-blue-600 hover:underline">
          official@doshkolnoe-na-lokanichnom.ru
        </a>
      </p>
    </LegalPage>
  );
}
