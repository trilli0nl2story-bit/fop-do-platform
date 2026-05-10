import { LegalPage } from './LegalPage';
import { CookieSettingsButton } from '../../components/CookieSettingsButton';

interface CookiePolicyProps {
  onNavigate: (page: string) => void;
}

export function CookiePolicy({ onNavigate }: CookiePolicyProps) {
  return (
    <LegalPage title="Политика cookie" onNavigate={onNavigate}>
      <p>
        Сайт использует обязательные cookie и похожие технологии хранения данных, чтобы работали вход в кабинет,
        корзина, безопасность, оплата и сохранение выбранных настроек.
      </p>
      <p>
        Аналитические и рекламные cookie используются только после вашего согласия в cookie-баннере. До согласия
        такие скрипты и пиксели не должны подключаться.
      </p>
      <h2 className="text-xl font-semibold text-gray-900">Категории</h2>
      <ul className="list-disc pl-5">
        <li>Обязательные — нужны для работы сайта и не отключаются.</li>
        <li>Аналитические — помогают понять, какие разделы нужно улучшать.</li>
        <li>Рекламные — могут использоваться для оценки рекламы и ретаргетинга после отдельного согласия.</li>
      </ul>
      <p>
        Вы можете выбрать «Только необходимые» или разрешить дополнительные категории. Изменить выбор можно в
        любой момент через кнопку ниже или через ссылку «Настройки cookie» в футере сайта.
      </p>
      <p>
        <CookieSettingsButton className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Изменить настройки cookie
        </CookieSettingsButton>
      </p>
      <p>
        Финальный юридический текст политики cookie должен быть проверен владельцем проекта и юристом перед
        основным релизом.
      </p>
    </LegalPage>
  );
}
