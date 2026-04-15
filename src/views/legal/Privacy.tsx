import { LegalPage } from './LegalPage';

interface PrivacyProps {
  onNavigate: (page: string) => void;
}

export function Privacy({ onNavigate }: PrivacyProps) {
  return (
    <LegalPage title="Политика обработки персональных данных" onNavigate={onNavigate}>
      <h2 className="text-xl font-semibold text-gray-900 mb-3">Оператор персональных данных</h2>
      <p className="text-gray-700 mb-6">
        ИП Васильева Наталья Александровна<br />
        ИНН 781631928699<br />
        ОГРНИП 323784700298822<br /><br />
        Email: <a href="mailto:official@doshkolnoe-na-lokanichnom.ru" className="text-blue-600 hover:underline">official@doshkolnoe-na-lokanichnom.ru</a>
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Обрабатываемые данные</h2>
      <p className="text-gray-700 mb-2">Сайт может обрабатывать следующие персональные данные:</p>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
        <li>имя</li>
        <li>email</li>
        <li>телефон</li>
        <li>IP-адрес</li>
        <li>данные браузера</li>
        <li>информация о действиях пользователя на сайте</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Цели обработки данных</h2>
      <p className="text-gray-700 mb-2">Данные используются для:</p>
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        <li>регистрации пользователя,</li>
        <li>обработки заказов,</li>
        <li>предоставления доступа к сервису,</li>
        <li>обратной связи,</li>
        <li>улучшения работы платформы.</li>
      </ul>
    </LegalPage>
  );
}
