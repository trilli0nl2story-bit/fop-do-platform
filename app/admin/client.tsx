'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Database,
  FileText,
  Loader2,
  Package,
  ShieldAlert,
  ShoppingBag,
  Upload,
  User,
  Users,
} from 'lucide-react';

type LoadState = 'loading' | 'unauth' | 'forbidden' | 'ready';

interface AdminSummary {
  stats: {
    users: number;
    categories: number;
    materials: {
      total: number;
      store: number;
      free: number;
      subscription: number;
      published: number;
    };
    files: number;
    orders: {
      total: number;
      paid: number;
      revenueRubles: number;
    };
  };
  recentFiles: Array<{
    id: string;
    fileRole: string;
    storageKey: string;
    fileSize: number | null;
    createdAt: string;
    materialTitle: string;
    materialSlug: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
  }>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(value: number | null) {
  if (!value) return 'размер не указан';
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} КБ`;
  return `${(value / 1024 / 1024).toFixed(2)} МБ`;
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
          {icon}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">{hint}</p>
    </div>
  );
}

export function AdminClient() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [email, setEmail] = useState('');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const accountRes = await fetch('/api/account/summary', { credentials: 'include' });
        if (accountRes.status === 401) {
          setLoadState('unauth');
          return;
        }
        if (!accountRes.ok) throw new Error('account');
        const account = await accountRes.json();
        setEmail(account.user?.email ?? '');
        if (!account.user?.isAdmin) {
          setLoadState('forbidden');
          return;
        }

        const summaryRes = await fetch('/api/admin/summary', { credentials: 'include' });
        if (!summaryRes.ok) throw new Error('summary');
        setSummary(await summaryRes.json());
        setLoadState('ready');
      } catch {
        setError('Не удалось загрузить админку. Обновите страницу.');
        setLoadState('ready');
      }
    }

    load();
  }, []);

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (loadState === 'unauth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Требуется авторизация</h1>
          <p className="text-sm text-gray-500 mb-6">Войдите в аккаунт администратора.</p>
          <Link href="/vhod" className="inline-flex px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (loadState === 'forbidden') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Доступ только для администратора</h1>
          <p className="text-sm text-gray-500 mb-6">У вашего аккаунта нет прав для просмотра этой страницы.</p>
          <Link href="/kabinet" className="inline-flex px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl">
            В кабинет
          </Link>
        </div>
      </div>
    );
  }

  const stats = summary?.stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
              М
            </Link>
            <span className="text-sm font-semibold text-gray-900">Администрирование</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="hidden sm:block">{email}</span>
            <Link href="/kabinet" className="font-medium text-blue-500 hover:text-blue-600">Кабинет →</Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Панель администратора</h1>
            <p className="text-sm text-gray-500">Живые данные из базы и быстрые действия для управления материалами.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/material-files"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl"
            >
              <Upload className="w-4 h-4" />
              Файлы материалов
            </Link>
            <Link
              href="/materialy"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-xl"
            >
              <BookOpen className="w-4 h-4" />
              Материалы
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {stats && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Пользователи"
                value={formatNumber(stats.users)}
                hint="Всего зарегистрировано"
                icon={<Users className="w-5 h-5" />}
              />
              <StatCard
                label="Материалы"
                value={formatNumber(stats.materials.total)}
                hint={`${formatNumber(stats.materials.published)} опубликовано`}
                icon={<Package className="w-5 h-5" />}
              />
              <StatCard
                label="Файлы"
                value={formatNumber(stats.files)}
                hint="Подключено к материалам"
                icon={<Database className="w-5 h-5" />}
              />
              <StatCard
                label="Заказы"
                value={formatNumber(stats.orders.total)}
                hint={`${formatNumber(stats.orders.paid)} оплачено`}
                icon={<ShoppingBag className="w-5 h-5" />}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold text-gray-900">Разбивка материалов</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs text-amber-700 mb-1">Магазин</p>
                    <p className="text-xl font-bold text-amber-900">{formatNumber(stats.materials.store)}</p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs text-green-700 mb-1">Бесплатные</p>
                    <p className="text-xl font-bold text-green-900">{formatNumber(stats.materials.free)}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs text-blue-700 mb-1">Подписка</p>
                    <p className="text-xl font-bold text-blue-900">{formatNumber(stats.materials.subscription)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold text-gray-900">Выручка</h2>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.orders.revenueRubles)} ₽</p>
                <p className="text-sm text-gray-500 mt-2">По оплаченным заказам</p>
              </div>
            </section>
          </>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Последние файлы</h2>
              <Link href="/admin/material-files" className="text-xs font-semibold text-blue-500 hover:text-blue-600">
                Управлять →
              </Link>
            </div>
            {summary?.recentFiles.length ? (
              <div className="space-y-3">
                {summary.recentFiles.map(file => (
                  <div key={file.id} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{file.materialTitle}</p>
                    <p className="text-xs text-gray-500 mt-1 break-all">{file.storageKey}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                      <span>{file.fileRole}</span>
                      <span>{formatBytes(file.fileSize)}</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Файлы ещё не подключены.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Последние пользователи</h2>
            {summary?.recentUsers.length ? (
              <div className="space-y-3">
                {summary.recentUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400">{formatDate(user.createdAt)}</p>
                    </div>
                    {user.isAdmin && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">admin</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Пользователей пока нет.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
