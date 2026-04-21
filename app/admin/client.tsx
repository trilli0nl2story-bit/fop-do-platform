'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bot,
  CheckCircle,
  Crown,
  DollarSign,
  FileText,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  Menu,
  Package,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { MaterialFileManager } from './material-file-manager';
import { CategoryManager } from './category-manager';
import { RevenueManager } from './revenue-manager';
import { OrdersManager } from './orders-manager';
import { SubscriptionsManager } from './subscriptions-manager';
import { ReferralsManager } from './referrals-manager';
import { DocumentRequestsManager } from './document-requests-manager';
import { AuthorApplicationsManager } from './author-applications-manager';
import { AiRequestsManager } from './ai-requests-manager';
import { YoungSpecialistManager } from './young-specialist-manager';

type LoadState = 'loading' | 'unauth' | 'forbidden' | 'ready';
type AdminSection =
  | 'dashboard'
  | 'revenue'
  | 'orders'
  | 'document-requests'
  | 'authors'
  | 'applications'
  | 'documents'
  | 'categories'
  | 'subscriptions'
  | 'referrals'
  | 'ai'
  | 'users'
  | 'young-specialist';

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

const navItems: Array<{
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  ready: boolean;
}> = [
  { id: 'dashboard', label: 'Обзор', icon: <LayoutDashboard className="w-5 h-5" />, ready: true },
  { id: 'revenue', label: 'Выручка', icon: <DollarSign className="w-5 h-5" />, ready: true },
  { id: 'orders', label: 'Заказы', icon: <Package className="w-5 h-5" />, ready: true },
  { id: 'document-requests', label: 'Заявки на документы', icon: <FileText className="w-5 h-5" />, ready: true },
  { id: 'authors', label: 'Авторы', icon: <TrendingUp className="w-5 h-5" />, ready: false },
  { id: 'applications', label: 'Авторские заявки', icon: <UserCheck className="w-5 h-5" />, ready: true },
  { id: 'documents', label: 'Документы', icon: <FileText className="w-5 h-5" />, ready: true },
  { id: 'categories', label: 'Категории', icon: <FolderOpen className="w-5 h-5" />, ready: true },
  { id: 'subscriptions', label: 'Подписки', icon: <Crown className="w-5 h-5" />, ready: true },
  { id: 'referrals', label: 'Рефералы', icon: <Share2 className="w-5 h-5" />, ready: true },
  { id: 'ai', label: 'AI-запросы', icon: <Bot className="w-5 h-5" />, ready: true },
  { id: 'users', label: 'Пользователи', icon: <Users className="w-5 h-5" />, ready: false },
  { id: 'young-specialist', label: 'Мол. специалист', icon: <HelpCircle className="w-5 h-5" />, ready: true },
];

const liveSections = new Set<AdminSection>([
  'dashboard',
  'revenue',
  'orders',
  'document-requests',
  'applications',
  'documents',
  'categories',
  'subscriptions',
  'referrals',
  'ai',
  'young-specialist',
]);

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

function DevelopmentNotice({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
        <RotateCcw className="w-6 h-6 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <span className="inline-flex mb-4 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
        разрабатывается
      </span>
      <p className="text-sm text-gray-500 max-w-2xl">
        Этот раздел оставлен в меню по смыслу старой удобной админки. Сейчас сюда не
        подставлены декоративные цифры и нерабочие кнопки. Когда подключим реальные
        данные и действия, пометка исчезнет.
      </p>
    </div>
  );
}

function DashboardSection({ summary }: { summary: AdminSummary | null }) {
  const stats = summary?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Обзор платформы</h1>
        <p className="text-sm text-gray-500">Живые данные из базы и быстрый вход в рабочие разделы.</p>
      </div>

      {stats && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
              icon={<FileText className="w-5 h-5" />}
            />
            <StatCard
              label="Заказы"
              value={formatNumber(stats.orders.total)}
              hint={`${formatNumber(stats.orders.paid)} оплачено`}
              icon={<ShoppingBag className="w-5 h-5" />}
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 xl:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-gray-900">Разбивка материалов</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <DollarSign className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-gray-900">Выручка</h2>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.orders.revenueRubles)} ₽</p>
              <p className="text-sm text-gray-500 mt-2">По оплаченным заказам</p>
            </div>
          </section>
        </>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Последние файлы</h2>
          {summary?.recentFiles.length ? (
            <div className="space-y-3">
              {summary.recentFiles.map((file) => (
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
              {summary.recentUsers.map((user) => (
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
    </div>
  );
}

export function AdminClient() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  const activeLabel = useMemo(
    () => navItems.find((item) => item.id === activeSection)?.label ?? 'Админка',
    [activeSection]
  );

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

  function renderSection() {
    if (activeSection === 'dashboard') return <DashboardSection summary={summary} />;
    if (activeSection === 'revenue') return <RevenueManager />;
    if (activeSection === 'orders') return <OrdersManager />;
    if (activeSection === 'document-requests') return <DocumentRequestsManager />;
    if (activeSection === 'applications') return <AuthorApplicationsManager />;
    if (activeSection === 'documents') return <MaterialFileManager />;
    if (activeSection === 'categories') return <CategoryManager />;
    if (activeSection === 'subscriptions') return <SubscriptionsManager />;
    if (activeSection === 'referrals') return <ReferralsManager />;
    if (activeSection === 'ai') return <AiRequestsManager />;
    if (activeSection === 'young-specialist') return <YoungSpecialistManager />;
    return <DevelopmentNotice title={activeLabel} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ${
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">М</span>
            <span className="text-sm font-bold text-gray-900">Админка</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Закрыть меню"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeSection === item.id ? 'text-blue-500' : 'text-gray-400'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {!item.ready && !liveSections.has(item.id) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  soon
                </span>
              )}
              {(item.ready || liveSections.has(item.id)) && item.id !== 'dashboard' && (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      <div className="flex-1 min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-900">{activeLabel}</span>
            {navItems.find((item) => item.id === activeSection && !item.ready && !liveSections.has(item.id)) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                разрабатывается
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="hidden sm:block">{email}</span>
            <Link href="/kabinet" className="font-medium text-blue-500 hover:text-blue-600">Кабинет →</Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
