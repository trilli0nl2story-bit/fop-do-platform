import { Menu, X, User, ShoppingCart, Gift, CircleUser as UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { usePostPurchaseDiscount } from '../context/PostPurchaseDiscountContext';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

const minimalPages = ['landing', 'login', 'register', 'offer', 'privacy', 'terms', 'consent', 'authors', 'refund'];

function isMinimalPage(page: string) {
  return minimalPages.includes(page) ||
    page.startsWith('document/') ||
    page.startsWith('category/') ||
    page.startsWith('program/') ||
    page.startsWith('age/') ||
    page.startsWith('needs/') ||
    page.startsWith('answer/');
}

export function Header({ currentPage, onNavigate, isAuthenticated }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count } = useCart();
  const { discount, hoursRemaining } = usePostPurchaseDiscount();
  const hasActiveDiscount = discount && !discount.used;
  const isExpiringSoon = hoursRemaining !== null && hoursRemaining <= 6;
  const minimal = isMinimalPage(currentPage);

  const navigationItems = [
    { name: 'Главная', page: 'dashboard' },
    { name: 'Материалы', page: 'materials-hub' },
    { name: 'Помощник', page: 'assistant' },
    { name: 'Мои документы', page: 'my-documents' },
    { name: 'Мол. специалист', page: 'young-specialist' },
  ];

  const mobileNavExtra = [
    { name: 'База ответов', page: 'answer-base' },
    { name: 'Профиль', page: 'profile' },
  ];

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
          >
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
              М
            </div>
            <span className="text-sm font-semibold text-gray-900 hidden sm:block leading-tight">
              Методический кабинет педагога
            </span>
            <span className="text-sm font-semibold text-gray-900 sm:hidden leading-tight">
              МКП
            </span>
          </div>

          {/* Full nav — authenticated, non-minimal pages */}
          {isAuthenticated && !minimal && (
            <nav className="hidden md:flex items-center gap-0.5">
              {navigationItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === item.page || (item.page === 'materials-hub' && ['free-materials', 'subscription-materials', 'store-materials'].includes(currentPage))
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {hasActiveDiscount && !minimal && (
                  <button
                    onClick={() => onNavigate('store-materials')}
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isExpiringSoon
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    −{discount.discountAmount} ₽
                  </button>
                )}
                <button
                  onClick={() => onNavigate('materials-hub')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Мои материалы</span>
                </button>
                <button
                  onClick={() => onNavigate('profile')}
                  title="Профиль"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 'profile'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Профиль</span>
                </button>
                {!minimal && (
                  <>
                    <button
                      onClick={() => onNavigate('cart')}
                      className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5 text-gray-500" />
                      {count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {count}
                        </span>
                      )}
                    </button>
                    <button
                      className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                      {mobileMenuOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {!minimal && (
                  <>
                    <button
                      onClick={() => onNavigate('library')}
                      className="hidden sm:block px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Библиотека
                    </button>
                    <button
                      onClick={() => onNavigate('answer-base')}
                      className="hidden sm:block px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      База ответов
                    </button>
                  </>
                )}
                <button
                  onClick={() => onNavigate('login')}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Войти →
                </button>
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && isAuthenticated && !minimal && (
          <nav className="md:hidden py-2 border-t border-gray-100 space-y-0.5">
            {[...navigationItems, ...mobileNavExtra].map((item) => (
              <button
                key={item.page}
                onClick={() => { onNavigate(item.page); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.page ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
