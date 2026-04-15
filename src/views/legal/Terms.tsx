import { LegalPage } from './LegalPage';

interface TermsProps {
  onNavigate: (page: string) => void;
}

export function Terms({ onNavigate }: TermsProps) {
  return (
    <LegalPage title="Пользовательское соглашение" onNavigate={onNavigate}>
      <p className="text-gray-700 mb-4">
        Используя сайт fop-do.ru, пользователь соглашается соблюдать следующие правила:
      </p>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
        <li>использовать сайт только в законных целях,</li>
        <li>не предпринимать попыток взлома системы,</li>
        <li>не распространять материалы платформы,</li>
        <li>не передавать доступ к аккаунту третьим лицам.</li>
      </ul>
      <p className="text-gray-700">
        Материалы сайта предназначены для личного использования.
      </p>
    </LegalPage>
  );
}
