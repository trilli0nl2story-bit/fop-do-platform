import { LegalPage } from './LegalPage';

interface OfferProps {
  onNavigate: (page: string) => void;
}

export function Offer({ onNavigate }: OfferProps) {
  return (
    <LegalPage title="Публичная оферта" onNavigate={onNavigate}>
      <p className="text-gray-600 mb-6">
        Индивидуальный предприниматель Васильева Наталья Александровна<br />
        ИНН 781631928699<br />
        ОГРНИП 323784700298822<br /><br />
        Email: <a href="mailto:official@doshkolnoe-na-lokanichnom.ru" className="text-blue-600 hover:underline">official@doshkolnoe-na-lokanichnom.ru</a>
      </p>

      <p className="text-gray-700 mb-6">
        Настоящий документ является официальным предложением (публичной офертой) заключить договор на условиях, изложенных ниже.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Предмет договора</h2>
      <p className="text-gray-700 mb-6">
        Предоставление доступа к цифровым образовательным материалам сайта fop-do.ru.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Акцепт оферты</h2>
      <p className="text-gray-700 mb-2">Акцептом оферты считается:</p>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
        <li>регистрация на сайте,</li>
        <li>оформление заказа,</li>
        <li>оплата документа,</li>
        <li>оформление подписки.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Доступ к материалам</h2>
      <p className="text-gray-700 mb-6">
        Пользователь получает доступ к материалам через личный кабинет.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Авторские права</h2>
      <p className="text-gray-700 mb-2">
        Материалы защищены авторским правом. Запрещается:
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        <li>копирование,</li>
        <li>распространение,</li>
        <li>перепродажа материалов без разрешения правообладателя.</li>
      </ul>
    </LegalPage>
  );
}
