'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, BookOpen, Star, FileText, ShoppingBag, User } from 'lucide-react';
import { useAuthSession } from '../../src/hooks/useAuthSession';

export function KabinetClient() {
  const router = useRouter();
  const { user, isAuthenticated, loading, refresh } = useAuthSession();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLogoutLoading(true);
    setLogoutError('');
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        refresh();
        router.push('/vhod');
      } else {
        setLogoutError('Не удалось выйти из аккаунта. Попробуйте ещё раз.');
      }
    } catch {
      setLogoutError('Ошибка соединения. Попробуйте ещё раз.');
    } finally {
      setLogoutLoading(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Личный кабинет</h1>
          <p className="text-gray-600 mb-8">
            Войдите в аккаунт, чтобы открыть личный кабинет.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/vhod"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/registratsiya"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
              М
            </div>
            <span className="text-sm font-semibold text-gray-900 hidden sm:block">
              Методический кабинет педагога
            </span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{logoutLoading ? 'Выход...' : 'Выйти'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                ✓ Аккаунт активен
              </span>
            </div>
          </div>
          {logoutError && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {logoutError}
            </p>
          )}
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Подписка</p>
            </div>
            <p className="text-sm text-gray-500">Подписка пока не подключена</p>
            <Link
              href="/materialy/podpiska"
              className="inline-block mt-3 text-xs font-medium text-blue-500 hover:text-blue-600"
            >
              Подключить →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Купленные материалы</p>
            </div>
            <p className="text-sm text-gray-500">Купленные материалы появятся здесь</p>
            <Link
              href="/materialy/magazin"
              className="inline-block mt-3 text-xs font-medium text-blue-500 hover:text-blue-600"
            >
              В магазин →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Заявки на документы</p>
            </div>
            <p className="text-sm text-gray-500">Заявки на документы появятся здесь</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Перейти к материалам</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/materialy"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Все материалы
            </Link>
            <Link
              href="/materialy/besplatno"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              Бесплатные
            </Link>
            <Link
              href="/materialy/podpiska"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              По подписке
            </Link>
            <Link
              href="/materialy/magazin"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              Магазин
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
