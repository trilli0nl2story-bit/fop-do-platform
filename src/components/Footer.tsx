import { Mail } from 'lucide-react';
import { CookieSettingsButton } from './CookieSettingsButton';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const legalLinks = [
  { label: 'Публичная оферта', href: '/legal/oferta' },
  { label: 'Политика обработки персональных данных', href: '/legal/konfidentsialnost' },
  { label: 'Политика cookie', href: '/legal/cookie-policy' },
  { label: 'Пользовательское соглашение', href: '/legal/usloviya' },
  { label: 'Согласие на обработку персональных данных', href: '/legal/soglasie' },
  { label: 'Условия подписки', href: '/legal/subscription' },
  { label: 'Правила AI-помощника', href: '/legal/ai-rules' },
  { label: 'Оплата и возврат', href: '/legal/vozvrat' },
  { label: 'Для авторов', href: '/legal/avtory' },
];

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                М
              </div>
              <span className="text-white font-semibold text-sm leading-tight">
                Методический кабинет педагога
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Проект «Дошкольное на лаконичном»
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Документы</h3>
            <ul className="space-y-2">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Реквизиты</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-300">ИП Васильева Наталья Александровна</li>
              <li>ИНН: 781631928699</li>
              <li>ОГРНИП: 323784700298822</li>
              <li>
                <a
                  href="mailto:official@doshkolnoe-na-lokanichnom.ru"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors mt-1"
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="break-all">official@doshkolnoe-na-lokanichnom.ru</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Поддержка</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:official@doshkolnoe-na-lokanichnom.ru"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Контакты
                </a>
              </li>
              <li>
                <a
                  href="mailto:official@doshkolnoe-na-lokanichnom.ru"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Поддержка
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  О проекте
                </button>
              </li>
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            Платформа работает в режиме мягкого запуска. Мы постепенно улучшаем сервис и добавляем новые функции.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              © 2024 Методический кабинет педагога &mdash; fop-do.ru
            </p>
            <p className="text-xs text-gray-600">
              Все материалы защищены авторским правом
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
