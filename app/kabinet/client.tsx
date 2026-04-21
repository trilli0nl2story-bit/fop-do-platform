'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogOut, BookOpen, Star, FileText, ShoppingBag, User, MapPin, Briefcase, Building, Download, Loader2, CheckCircle2, Share2 } from 'lucide-react';
import { useAuthSession } from '../../src/hooks/useAuthSession';

interface AccountSummary {
  user: { id: string; email: string; isAdmin: boolean; emailVerified: boolean };
  emailVerification: {
    deliveryConfigured: boolean;
  };
  profile: {
    name: string; lastName: string; patronymic: string;
    role: string; city: string; institution: string; phone: string;
  };
  subscription: {
    status: 'none' | 'active' | 'expired' | 'cancelled' | 'paused';
    planCode: string | null;
    currentPeriodEnd: string | null;
  };
  materials: {
    total: number;
    items: Array<{
      id: string; slug: string; title: string;
      accessType: string; grantedAt: string; expiresAt: string | null;
    }>;
  };
  documentRequests: {
    total: number;
    items: Array<{ id: string; description: string; status: string; createdAt: string }>;
  };
  orders: {
    total: number;
    paidTotalRubles: number;
    items: Array<{
      id: string;
      status: string;
      totalRubles: number;
      discountRubles: number;
      createdAt: string;
      paidAt: string | null;
    }>;
  };
  referral: {
    code: string;
    discountPercent: number;
    linkPath: string;
    registeredCount: number;
    paidCount: number;
    recentInvites: Array<{
      id: string;
      email: string;
      status: string;
      updatedAt: string;
    }>;
  };
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  none: 'Подписка пока не подключена',
  expired: 'Подписка истекла',
  cancelled: 'Подписка отменена',
  paused: 'Подписка приостановлена',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  received: 'Получена',
  in_progress: 'В работе',
  draft_generated: 'Черновик готов',
  under_review: 'На проверке',
  completed: 'Выполнена',
  rejected: 'Отклонена',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function KabinetClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading, refresh } = useAuthSession();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState('');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    lastName: '',
    patronymic: '',
    role: '',
    city: '',
    institution: '',
    phone: '',
  });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [dlStates, setDlStates] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'denied' | 'error'>>({});
  const [dlMessages, setDlMessages] = useState<Record<string, string>>({});
  const [dlUrls, setDlUrls] = useState<Record<string, string>>({});

  async function loadSummary() {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const response = await fetch('/api/account/summary', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(String(response.status));
      }

      const data = await response.json();
      setSummary(data);
      setProfileForm({
        name: data.profile?.name ?? '',
        lastName: data.profile?.lastName ?? '',
        patronymic: data.profile?.patronymic ?? '',
        role: data.profile?.role ?? '',
        city: data.profile?.city ?? '',
        institution: data.profile?.institution ?? '',
        phone: data.profile?.phone ?? '',
      });
    } catch {
      setSummaryError('Не удалось загрузить данные кабинета. Попробуйте обновить страницу.');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleDownload(slug: string) {
    setDlStates(prev => ({ ...prev, [slug]: 'loading' }));
    setDlMessages(prev => ({ ...prev, [slug]: '' }));
    try {
      const res = await fetch('/api/materials/download', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialSlug: slug }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const dl = data.download ?? {};
        setDlStates(prev => ({ ...prev, [slug]: 'ok' }));
        setDlMessages(prev => ({ ...prev, [slug]: dl.message ?? 'Доступ подтверждён.' }));
        if (dl.status === 'ready' && typeof dl.url === 'string' && dl.url) {
          setDlUrls(prev => ({ ...prev, [slug]: dl.url }));
          window.open(dl.url, '_blank', 'noopener,noreferrer');
        }
      } else if (res.status === 403) {
        setDlStates(prev => ({ ...prev, [slug]: 'denied' }));
        setDlMessages(prev => ({ ...prev, [slug]: data.message ?? 'Доступ ограничен.' }));
      } else {
        setDlStates(prev => ({ ...prev, [slug]: 'error' }));
        setDlMessages(prev => ({ ...prev, [slug]: 'Не удалось открыть материал. Попробуйте ещё раз.' }));
      }
    } catch {
      setDlStates(prev => ({ ...prev, [slug]: 'error' }));
      setDlMessages(prev => ({ ...prev, [slug]: 'Не удалось открыть материал. Попробуйте ещё раз.' }));
    }
  }

  async function handleResendVerification() {
    setVerifyLoading(true);
    setVerifyError('');
    setVerifyMessage('');
    try {
      const res = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setVerifyError(
          data.message ?? data.error ?? 'Не удалось отправить письмо. Попробуйте ещё раз.'
        );
        return;
      }

      setVerifyMessage(
        data.message ??
          'Письмо для подтверждения отправлено. Проверьте почту и папку со спамом.'
      );
    } catch {
      setVerifyError('Не удалось отправить письмо. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setVerifyLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    setSummaryLoading(true);
    setSummaryError('');
    fetch('/api/account/summary', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setSummary(data))
      .catch(() => setSummaryError('Не удалось загрузить данные кабинета. Попробуйте обновить страницу.'))
      .finally(() => setSummaryLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!summary) return;
    setProfileForm({
      name: summary.profile?.name ?? '',
      lastName: summary.profile?.lastName ?? '',
      patronymic: summary.profile?.patronymic ?? '',
      role: summary.profile?.role ?? '',
      city: summary.profile?.city ?? '',
      institution: summary.profile?.institution ?? '',
      phone: summary.profile?.phone ?? '',
    });
  }, [summary]);

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setProfileError(data.error ?? 'Не удалось сохранить профиль. Попробуйте ещё раз.');
        return;
      }

      await loadSummary();
      setProfileMessage('Профиль сохранён.');
      setProfileEditOpen(false);
    } catch {
      setProfileError('Не удалось сохранить профиль. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleCopyReferralLink() {
    if (!referral) return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${referral.linkPath}`);
      setReferralMessage('Ссылка скопирована.');
    } catch {
      setReferralMessage('Не удалось скопировать ссылку автоматически.');
    }

    window.setTimeout(() => setReferralMessage(''), 2500);
  }

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

  async function handleLogoutAll() {
    setLogoutAllLoading(true);
    setLogoutAllError('');
    try {
      const res = await fetch('/api/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        refresh();
        router.push(data.redirectTo ?? '/vhod?sessionReset=success');
      } else {
        setLogoutAllError(
          data.message ??
            data.error ??
            'Не удалось завершить сессии на других устройствах. Попробуйте ещё раз.'
        );
      }
    } catch {
      setLogoutAllError(
        'Не удалось завершить сессии на других устройствах. Проверьте соединение и попробуйте ещё раз.'
      );
    } finally {
      setLogoutAllLoading(false);
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

  const prof = summary?.profile;
  const sub = summary?.subscription;
  const mats = summary?.materials;
  const docs = summary?.documentRequests;
  const orders = summary?.orders;
  const referral = summary?.referral;

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Summary load error */}
        {summaryError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            {summaryError}
          </div>
        )}

        {searchParams.get('emailVerification') === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            Почта подтверждена. Теперь аккаунт полностью активирован.
          </div>
        )}

        {summary && !summary.user.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">
                  Подтвердите email, чтобы завершить настройку аккаунта
                </p>
                <p className="text-sm text-amber-800">
                  {summary.emailVerification.deliveryConfigured
                    ? `Мы отправили письмо на ${summary.user.email}. Если письма нет, проверьте папку со спамом или отправьте его повторно.`
                    : 'Аккаунт уже создан, но отправка писем на сервере пока не подключена. После настройки SMTP здесь можно будет сразу отправить письмо для подтверждения.'}
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={verifyLoading || !summary.emailVerification.deliveryConfigured}
                className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {verifyLoading
                  ? 'Отправка...'
                  : summary.emailVerification.deliveryConfigured
                    ? 'Отправить письмо ещё раз'
                    : 'Письма пока не подключены'}
              </button>
            </div>
            {verifyMessage && (
              <p className="mt-3 text-sm text-green-700">{verifyMessage}</p>
            )}
            {verifyError && (
              <p className="mt-3 text-sm text-red-600">{verifyError}</p>
            )}
          </div>
        )}

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-4 justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              {prof?.name ? (
                <p className="text-base font-semibold text-gray-900">
                  {[prof.name, prof.patronymic].filter(Boolean).join(' ')}
                </p>
              ) : null}
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                  ✓ Аккаунт активен
                </span>
                {prof?.role && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                    <Briefcase className="w-3 h-3" />{prof.role}
                  </span>
                )}
                {prof?.city && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                    <MapPin className="w-3 h-3" />{prof.city}
                  </span>
                )}
                {prof?.institution && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                    <Building className="w-3 h-3" />{prof.institution}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileEditOpen(prev => !prev);
                setProfileError('');
                setProfileMessage('');
              }}
              className="flex-shrink-0 px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              {profileEditOpen ? 'Скрыть' : 'Редактировать'}
            </button>
          </div>
          {profileMessage && (
            <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              {profileMessage}
            </p>
          )}
          {profileEditOpen && (
            <div className="mt-4 border border-gray-100 rounded-2xl p-4 bg-gray-50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Имя"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.lastName}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Фамилия"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.patronymic}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, patronymic: event.target.value }))}
                  placeholder="Отчество"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.role}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, role: event.target.value }))}
                  placeholder="Роль"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.city}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, city: event.target.value }))}
                  placeholder="Город"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.institution}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, institution: event.target.value }))}
                  placeholder="Учреждение"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
              </div>
              <input
                value={profileForm.phone}
                onChange={(event) => setProfileForm(prev => ({ ...prev, phone: event.target.value }))}
                placeholder="Телефон"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
              />
              {profileError && (
                <p className="text-sm text-red-600">{profileError}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {profileSaving ? 'Сохраняем...' : 'Сохранить профиль'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileEditOpen(false);
                    setProfileError('');
                    setProfileMessage('');
                    if (summary) {
                      setProfileForm({
                        name: summary.profile?.name ?? '',
                        lastName: summary.profile?.lastName ?? '',
                        patronymic: summary.profile?.patronymic ?? '',
                        role: summary.profile?.role ?? '',
                        city: summary.profile?.city ?? '',
                        institution: summary.profile?.institution ?? '',
                        phone: summary.profile?.phone ?? '',
                      });
                    }
                  }}
                  className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
          {logoutError && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {logoutError}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogoutAll}
              disabled={logoutAllLoading}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {logoutAllLoading ? 'Завершаем все сессии...' : 'Выйти на всех устройствах'}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Полезно, если вы заходили с чужого компьютера или хотите сбросить все старые входы.
            </p>
            {logoutAllError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {logoutAllError}
              </p>
            )}
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Subscription */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Подписка</p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Загрузка...</p>
            ) : sub?.status === 'active' ? (
              <p className="text-sm text-green-700 font-medium">
                Подписка активна{sub.currentPeriodEnd ? ` до ${formatDate(sub.currentPeriodEnd)}` : ''}
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500">{SUBSCRIPTION_LABELS[sub?.status ?? 'none']}</p>
                <Link href="/materialy/podpiska" className="inline-block mt-3 text-xs font-medium text-blue-500 hover:text-blue-600">
                  Подключить →
                </Link>
              </>
            )}
          </div>

          {/* Materials */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Купленные материалы{mats && mats.total > 0 ? ` (${mats.total})` : ''}
              </p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Загрузка...</p>
            ) : mats && mats.total > 0 ? (
              <ul className="space-y-3">
                {mats.items.map(m => {
                  const ds = dlStates[m.slug] ?? 'idle';
                  const dm = dlMessages[m.slug] ?? '';
                  return (
                    <li key={m.id} className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/materialy/magazin/${m.slug}`}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline line-clamp-2 flex-1"
                        >
                          {m.title}
                        </Link>
                        {ds === 'ok' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {dlUrls[m.slug] ? 'Ссылка открыта ✓' : 'Доступ открыт'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDownload(m.slug)}
                            disabled={ds === 'loading'}
                            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 disabled:opacity-50 flex-shrink-0"
                          >
                            {ds === 'loading'
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Download className="w-3.5 h-3.5" />
                            }
                            {ds === 'loading' ? 'Открытие...' : 'Скачать'}
                          </button>
                        )}
                      </div>
                      {dm && (
                        <p className={`text-xs ${ds === 'ok' ? 'text-green-700' : 'text-red-500'}`}>
                          {dm}
                        </p>
                      )}
                    </li>
                  );
                })}
                {mats.total > mats.items.length && (
                  <li className="text-xs text-gray-400 pt-1">
                    + ещё {mats.total - mats.items.length} материалов
                  </li>
                )}
              </ul>
            ) : (
              <>
                <p className="text-sm text-gray-500">Купленные материалы появятся здесь</p>
                <Link href="/materialy/magazin" className="inline-block mt-3 text-xs font-medium text-blue-500 hover:text-blue-600">
                  В магазин →
                </Link>
              </>
            )}
          </div>

          {/* Orders */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Заказы{orders && orders.total > 0 ? ` (${orders.total})` : ''}
              </p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Загрузка...</p>
            ) : orders && orders.total > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Оплачено на сумму <span className="font-semibold">{orders.paidTotalRubles.toLocaleString('ru-RU')} ₽</span>
                </p>
                <ul className="space-y-2">
                  {orders.items.slice(0, 3).map((order) => (
                    <li key={order.id} className="text-xs text-gray-500">
                      {order.status === 'paid' ? 'Оплачен' : order.status === 'pending' ? 'Ожидает оплату' : order.status}
                      {' '}· {order.totalRubles.toLocaleString('ru-RU')} ₽ · {formatDate(order.createdAt)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Оплаченные заказы появятся здесь после первых покупок.</p>
            )}
          </div>

          {/* Referral */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
                <Share2 className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Реферальная скидка</p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Загрузка...</p>
            ) : referral ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Ваш код: <span className="font-semibold tracking-wide">{referral.code}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Дает {referral.discountPercent}% скидки на первый оплаченный заказ.
                </p>
                <p className="text-xs text-gray-500">
                  Пришло по вашей ссылке: {referral.registeredCount}, оплатили: {referral.paidCount}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Реферальный код появится здесь автоматически.</p>
            )}
          </div>

          {referral && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Реферальная ссылка</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyReferralLink}
                  className="inline-flex items-center justify-center px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Скопировать ссылку
                </button>
                <span className="text-sm text-gray-500 break-all">{referral.linkPath}</span>
              </div>
              {referralMessage && (
                <p className="mt-3 text-sm text-green-700">{referralMessage}</p>
              )}
              {referral.recentInvites.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Последние переходы по вашей ссылке</p>
                  <ul className="space-y-1">
                    {referral.recentInvites.slice(0, 3).map((invite) => (
                      <li key={invite.id} className="text-sm text-gray-500">
                        {invite.email} · {invite.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Document requests */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Заявки на документы{docs && docs.total > 0 ? ` (${docs.total})` : ''}
              </p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Загрузка...</p>
            ) : docs && docs.total > 0 ? (
              <ul className="space-y-2">
                {docs.items.map(d => (
                  <li key={d.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-block px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                      d.status === 'completed' ? 'bg-green-50 text-green-700' :
                      d.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {DOC_STATUS_LABELS[d.status] ?? d.status}
                    </span>
                    <span className="text-sm text-gray-600 line-clamp-1">{d.description}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Заявки на документы появятся здесь</p>
            )}
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

        {/* Admin block — visible only to admins */}
        {summary?.user?.isAdmin && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">Администрирование</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Панель администратора
              </Link>
              <Link
                href="/admin/material-files"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-200 hover:border-amber-300 text-amber-700 text-sm font-medium rounded-xl transition-colors"
              >
                Файлы материалов
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
