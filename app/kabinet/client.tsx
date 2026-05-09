'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogOut, BookOpen, Star, FileText, ShoppingBag, User, MapPin, Briefcase, Building, Download, Loader2, CheckCircle2, Share2, Bot } from 'lucide-react';
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
  authorApplications: {
    total: number;
    items: Array<{
      id: string;
      status: string;
      employmentType: string;
      sampleUrl: string;
      createdAt: string;
    }>;
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
  ai: {
    available: boolean;
    reason: 'active' | 'no_subscription' | 'not_configured';
    monthlyLimit: number;
    usedThisMonth: number;
    remainingThisMonth: number;
    subscriptionActive: boolean;
    configured: boolean;
  };
}

interface UserOrderDetail {
  order: {
    id: string;
    status: string;
    totalRubles: number;
    discountRubles: number;
    referralDiscountPercent: number;
    couponCode: string | null;
    createdAt: string;
    paidAt: string | null;
  };
  payment: {
    status: string;
    provider: string;
    providerPaymentId: string | null;
    amountRubles: number;
    paidAt: string | null;
    resumePaymentUrl: string | null;
  } | null;
  items: Array<{
    materialId: string;
    slug: string;
    title: string;
    priceRubles: number;
  }>;
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  none: 'РџРѕРґРїРёСЃРєР° РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅР°',
  expired: 'РџРѕРґРїРёСЃРєР° РёСЃС‚РµРєР»Р°',
  cancelled: 'РџРѕРґРїРёСЃРєР° РѕС‚РјРµРЅРµРЅР°',
  paused: 'РџРѕРґРїРёСЃРєР° РїСЂРёРѕСЃС‚Р°РЅРѕРІР»РµРЅР°',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  received: 'РџРѕР»СѓС‡РµРЅР°',
  in_progress: 'Р’ СЂР°Р±РѕС‚Рµ',
  draft_generated: 'Р§РµСЂРЅРѕРІРёРє РіРѕС‚РѕРІ',
  under_review: 'РќР° РїСЂРѕРІРµСЂРєРµ',
  completed: 'Р’С‹РїРѕР»РЅРµРЅР°',
  rejected: 'РћС‚РєР»РѕРЅРµРЅР°',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'РћР¶РёРґР°РµС‚ РѕРїР»Р°С‚Сѓ',
  paid: 'РћРїР»Р°С‡РµРЅ',
  cancelled: 'РћС‚РјРµРЅС‘РЅ',
  refunded: 'Р’РѕР·РІСЂР°С‚',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'РћР¶РёРґР°РµС‚ РѕРїР»Р°С‚Сѓ',
  succeeded: 'РћРїР»Р°С‡РµРЅ',
  failed: 'РћС€РёР±РєР°',
  refunded: 'Р’РѕР·РІСЂР°С‚',
};

const AUTHOR_STATUS_LABELS: Record<string, string> = {
  pending: '\u041d\u0430 \u0440\u0430\u0441\u0441\u043c\u043e\u0442\u0440\u0435\u043d\u0438\u0438',
  under_review: '\u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435',
  approved: '\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u0430',
  rejected: '\u041e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0430',
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
  const [expandedOrderId, setExpandedOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState<Record<string, UserOrderDetail | null>>({});
  const [orderDetailsLoadingId, setOrderDetailsLoadingId] = useState('');

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
      setSummaryError('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґР°РЅРЅС‹Рµ РєР°Р±РёРЅРµС‚Р°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ.');
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
        setDlMessages(prev => ({ ...prev, [slug]: dl.message ?? 'Р”РѕСЃС‚СѓРї РїРѕРґС‚РІРµСЂР¶РґС‘РЅ.' }));
        if (dl.status === 'ready' && typeof dl.url === 'string' && dl.url) {
          setDlUrls(prev => ({ ...prev, [slug]: dl.url }));
          window.open(dl.url, '_blank', 'noopener,noreferrer');
        }
      } else if (res.status === 403) {
        setDlStates(prev => ({ ...prev, [slug]: 'denied' }));
        setDlMessages(prev => ({ ...prev, [slug]: data.message ?? 'Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ.' }));
      } else {
        setDlStates(prev => ({ ...prev, [slug]: 'error' }));
        setDlMessages(prev => ({ ...prev, [slug]: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РјР°С‚РµСЂРёР°Р». РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.' }));
      }
    } catch {
      setDlStates(prev => ({ ...prev, [slug]: 'error' }));
      setDlMessages(prev => ({ ...prev, [slug]: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РјР°С‚РµСЂРёР°Р». РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.' }));
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
          data.message ?? data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.'
        );
        return;
      }

      setVerifyMessage(
        data.message ??
          'РџРёСЃСЊРјРѕ РґР»СЏ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РѕС‚РїСЂР°РІР»РµРЅРѕ. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕС‡С‚Сѓ Рё РїР°РїРєСѓ СЃРѕ СЃРїР°РјРѕРј.'
      );
    } catch {
      setVerifyError('РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ. РџСЂРѕРІРµСЂСЊС‚Рµ СЃРѕРµРґРёРЅРµРЅРёРµ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
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
      .catch(() => setSummaryError('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґР°РЅРЅС‹Рµ РєР°Р±РёРЅРµС‚Р°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ.'))
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
        setProfileError(data.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
        return;
      }

      await loadSummary();
      setProfileMessage('РџСЂРѕС„РёР»СЊ СЃРѕС…СЂР°РЅС‘РЅ.');
      setProfileEditOpen(false);
    } catch {
      setProfileError('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊ. РџСЂРѕРІРµСЂСЊС‚Рµ СЃРѕРµРґРёРЅРµРЅРёРµ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleCopyReferralLink() {
    if (!referral) return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${referral.linkPath}`);
      setReferralMessage('РЎСЃС‹Р»РєР° СЃРєРѕРїРёСЂРѕРІР°РЅР°.');
    } catch {
      setReferralMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ СЃСЃС‹Р»РєСѓ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.');
    }

    window.setTimeout(() => setReferralMessage(''), 2500);
  }

  async function handleToggleOrder(orderId: string) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId('');
      return;
    }

    setExpandedOrderId(orderId);
    if (orderDetails[orderId]) {
      return;
    }

    setOrderDetailsLoadingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.order) {
        setOrderDetails(prev => ({ ...prev, [orderId]: null }));
        return;
      }

      setOrderDetails(prev => ({ ...prev, [orderId]: data.order as UserOrderDetail }));
    } catch {
      setOrderDetails(prev => ({ ...prev, [orderId]: null }));
    } finally {
      setOrderDetailsLoadingId('');
    }
  }

  function handleResumePayment(url: string) {
    if (!url) return;
    window.location.assign(url);
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
        setLogoutError('РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
      }
    } catch {
      setLogoutError('РћС€РёР±РєР° СЃРѕРµРґРёРЅРµРЅРёСЏ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
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
            'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РІРµСЂС€РёС‚СЊ СЃРµСЃСЃРёРё РЅР° РґСЂСѓРіРёС… СѓСЃС‚СЂРѕР№СЃС‚РІР°С…. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.'
        );
      }
    } catch {
      setLogoutAllError(
        'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РІРµСЂС€РёС‚СЊ СЃРµСЃСЃРёРё РЅР° РґСЂСѓРіРёС… СѓСЃС‚СЂРѕР№СЃС‚РІР°С…. РџСЂРѕРІРµСЂСЊС‚Рµ СЃРѕРµРґРёРЅРµРЅРёРµ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.'
      );
    } finally {
      setLogoutAllLoading(false);
    }
  }

  // в”Ђв”Ђ Loading в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Р—Р°РіСЂСѓР·РєР°...</p>
      </div>
    );
  }

  // в”Ђв”Ђ Not authenticated в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚</h1>
          <p className="text-gray-600 mb-8">
            Р’РѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚, С‡С‚РѕР±С‹ РѕС‚РєСЂС‹С‚СЊ Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/vhod"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Р’РѕР№С‚Рё
            </Link>
            <Link
              href="/registratsiya"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ
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
  const authorApplications = summary?.authorApplications;
  const orders = summary?.orders;
  const referral = summary?.referral;
  const ai = summary?.ai;

  // в”Ђв”Ђ Authenticated в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
              Рњ
            </div>
            <span className="text-sm font-semibold text-gray-900 hidden sm:block">
              РњРµС‚РѕРґРёС‡РµСЃРєРёР№ РєР°Р±РёРЅРµС‚ РїРµРґР°РіРѕРіР°
            </span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{logoutLoading ? 'Р’С‹С…РѕРґ...' : 'Р’С‹Р№С‚Рё'}</span>
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
            РџРѕС‡С‚Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅР°. РўРµРїРµСЂСЊ Р°РєРєР°СѓРЅС‚ РїРѕР»РЅРѕСЃС‚СЊСЋ Р°РєС‚РёРІРёСЂРѕРІР°РЅ.
          </div>
        )}

        {summary && !summary.user.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">
                  РџРѕРґС‚РІРµСЂРґРёС‚Рµ email, С‡С‚РѕР±С‹ Р·Р°РІРµСЂС€РёС‚СЊ РЅР°СЃС‚СЂРѕР№РєСѓ Р°РєРєР°СѓРЅС‚Р°
                </p>
                <p className="text-sm text-amber-800">
                  {summary.emailVerification.deliveryConfigured
                    ? `РњС‹ РѕС‚РїСЂР°РІРёР»Рё РїРёСЃСЊРјРѕ РЅР° ${summary.user.email}. Р•СЃР»Рё РїРёСЃСЊРјР° РЅРµС‚, РїСЂРѕРІРµСЂСЊС‚Рµ РїР°РїРєСѓ СЃРѕ СЃРїР°РјРѕРј РёР»Рё РѕС‚РїСЂР°РІСЊС‚Рµ РµРіРѕ РїРѕРІС‚РѕСЂРЅРѕ.`
                    : 'РђРєРєР°СѓРЅС‚ СѓР¶Рµ СЃРѕР·РґР°РЅ, РЅРѕ РѕС‚РїСЂР°РІРєР° РїРёСЃРµРј РЅР° СЃРµСЂРІРµСЂРµ РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅР°. РџРѕСЃР»Рµ РЅР°СЃС‚СЂРѕР№РєРё SMTP Р·РґРµСЃСЊ РјРѕР¶РЅРѕ Р±СѓРґРµС‚ СЃСЂР°Р·Сѓ РѕС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ РґР»СЏ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ.'}
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={verifyLoading || !summary.emailVerification.deliveryConfigured}
                className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {verifyLoading
                  ? 'РћС‚РїСЂР°РІРєР°...'
                  : summary.emailVerification.deliveryConfigured
                    ? 'РћС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ РµС‰С‘ СЂР°Р·'
                    : 'РџРёСЃСЊРјР° РїРѕРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹'}
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
                  вњ“ РђРєРєР°СѓРЅС‚ Р°РєС‚РёРІРµРЅ
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
              {profileEditOpen ? 'РЎРєСЂС‹С‚СЊ' : 'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ'}
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
                  placeholder="РРјСЏ"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.lastName}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Р¤Р°РјРёР»РёСЏ"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.patronymic}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, patronymic: event.target.value }))}
                  placeholder="РћС‚С‡РµСЃС‚РІРѕ"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.role}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, role: event.target.value }))}
                  placeholder="Р РѕР»СЊ"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.city}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, city: event.target.value }))}
                  placeholder="Р“РѕСЂРѕРґ"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
                <input
                  value={profileForm.institution}
                  onChange={(event) => setProfileForm(prev => ({ ...prev, institution: event.target.value }))}
                  placeholder="РЈС‡СЂРµР¶РґРµРЅРёРµ"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white"
                />
              </div>
              <input
                value={profileForm.phone}
                onChange={(event) => setProfileForm(prev => ({ ...prev, phone: event.target.value }))}
                placeholder="РўРµР»РµС„РѕРЅ"
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
                  {profileSaving ? 'РЎРѕС…СЂР°РЅСЏРµРј...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊ'}
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
                  РћС‚РјРµРЅР°
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
              {logoutAllLoading ? 'Р—Р°РІРµСЂС€Р°РµРј РІСЃРµ СЃРµСЃСЃРёРё...' : 'Р’С‹Р№С‚Рё РЅР° РІСЃРµС… СѓСЃС‚СЂРѕР№СЃС‚РІР°С…'}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              РџРѕР»РµР·РЅРѕ, РµСЃР»Рё РІС‹ Р·Р°С…РѕРґРёР»Рё СЃ С‡СѓР¶РѕРіРѕ РєРѕРјРїСЊСЋС‚РµСЂР° РёР»Рё С…РѕС‚РёС‚Рµ СЃР±СЂРѕСЃРёС‚СЊ РІСЃРµ СЃС‚Р°СЂС‹Рµ РІС…РѕРґС‹.
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
              <p className="text-sm font-semibold text-gray-800">РџРѕРґРїРёСЃРєР°</p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Р—Р°РіСЂСѓР·РєР°...</p>
            ) : sub?.status === 'active' ? (
              <p className="text-sm text-green-700 font-medium">
                РџРѕРґРїРёСЃРєР° Р°РєС‚РёРІРЅР°{sub.currentPeriodEnd ? ` РґРѕ ${formatDate(sub.currentPeriodEnd)}` : ''}
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500">{SUBSCRIPTION_LABELS[sub?.status ?? 'none']}</p>
                <Link href="/materialy/podpiska" className="inline-block mt-3 text-xs font-medium text-blue-500 hover:text-blue-600">
                  РџРѕРґРєР»СЋС‡РёС‚СЊ в†’
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
                РљСѓРїР»РµРЅРЅС‹Рµ РјР°С‚РµСЂРёР°Р»С‹{mats && mats.total > 0 ? ` (${mats.total})` : ''}
              </p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Р—Р°РіСЂСѓР·РєР°...</p>
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
                            {dlUrls[m.slug] ? 'РЎСЃС‹Р»РєР° РѕС‚РєСЂС‹С‚Р° вњ“' : 'Р”РѕСЃС‚СѓРї РѕС‚РєСЂС‹С‚'}
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
                            {ds === 'loading' ? 'РћС‚РєСЂС‹С‚РёРµ...' : 'РЎРєР°С‡Р°С‚СЊ'}
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
                    + РµС‰С‘ {mats.total - mats.items.length} РјР°С‚РµСЂРёР°Р»РѕРІ
                  </li>
                )}
              </ul>
            ) : (
              <>
                <p className="text-sm text-gray-500">РљСѓРїР»РµРЅРЅС‹Рµ РјР°С‚РµСЂРёР°Р»С‹ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ</p>
                <Link href="/materialy/magazin" className="inline-block mt-3 text-xs font-medium text-blue-500 hover:text-blue-600">
                  Р’ РјР°РіР°Р·РёРЅ в†’
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
                Р—Р°РєР°Р·С‹{orders && orders.total > 0 ? ` (${orders.total})` : ''}
              </p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Р—Р°РіСЂСѓР·РєР°...</p>
            ) : orders && orders.total > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  РћРїР»Р°С‡РµРЅРѕ РЅР° СЃСѓРјРјСѓ <span className="font-semibold">{orders.paidTotalRubles.toLocaleString('ru-RU')} в‚Ѕ</span>
                </p>
                <ul className="space-y-2">
                  {orders.items.slice(0, 3).map((order) => (
                    <li key={order.id} className="text-xs text-gray-500">
                      {order.status === 'paid' ? 'РћРїР»Р°С‡РµРЅ' : order.status === 'pending' ? 'РћР¶РёРґР°РµС‚ РѕРїР»Р°С‚Сѓ' : order.status}
                      {' '}В· {order.totalRubles.toLocaleString('ru-RU')} в‚Ѕ В· {formatDate(order.createdAt)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500">РћРїР»Р°С‡РµРЅРЅС‹Рµ Р·Р°РєР°Р·С‹ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ РїРѕСЃР»Рµ РїРµСЂРІС‹С… РїРѕРєСѓРїРѕРє.</p>
            )}
          </div>

          {/* AI */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">AI-Р·Р°РїСЂРѕСЃС‹</p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Р—Р°РіСЂСѓР·РєР°...</p>
            ) : ai ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  РћСЃС‚Р°Р»РѕСЃСЊ <span className="font-semibold">{ai.remainingThisMonth}</span> РёР· {ai.monthlyLimit} РІ СЌС‚РѕРј РјРµСЃСЏС†Рµ
                </p>
                <p className="text-xs text-gray-500">
                  {ai.subscriptionActive
                    ? ai.configured
                      ? 'РџРѕРјРѕС‰РЅРёРє РґРѕСЃС‚СѓРїРµРЅ РїРѕ Р°РєС‚РёРІРЅРѕР№ РїРѕРґРїРёСЃРєРµ.'
                      : 'РљР»СЋС‡ OpenAI РµС‰С‘ РЅРµ РґРѕР±Р°РІР»РµРЅ РЅР° СЃРµСЂРІРµСЂ.'
                    : 'AI-РїРѕРјРѕС‰РЅРёРє РѕС‚РєСЂРѕРµС‚СЃСЏ РїРѕСЃР»Рµ РїРѕРґРєР»СЋС‡РµРЅРёСЏ РїРѕРґРїРёСЃРєРё.'}
                </p>
                <Link href="/pomoshchnik" className="inline-block pt-1 text-xs font-medium text-blue-500 hover:text-blue-600">
                  РћС‚РєСЂС‹С‚СЊ РїРѕРјРѕС‰РЅРёРєР° в†’
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">РЎС‚Р°С‚СѓСЃ РїРѕРјРѕС‰РЅРёРєР° РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.</p>
            )}
          </div>

          {/* Referral */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
                <Share2 className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Р РµС„РµСЂР°Р»СЊРЅР°СЏ СЃРєРёРґРєР°</p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Р—Р°РіСЂСѓР·РєР°...</p>
            ) : referral ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Р’Р°С€ РєРѕРґ: <span className="font-semibold tracking-wide">{referral.code}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Р”Р°РµС‚ {referral.discountPercent}% СЃРєРёРґРєРё РЅР° РїРµСЂРІС‹Р№ РѕРїР»Р°С‡РµРЅРЅС‹Р№ Р·Р°РєР°Р·.
                </p>
                <p className="text-xs text-gray-500">
                  РџСЂРёС€Р»Рѕ РїРѕ РІР°С€РµР№ СЃСЃС‹Р»РєРµ: {referral.registeredCount}, РѕРїР»Р°С‚РёР»Рё: {referral.paidCount}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Р РµС„РµСЂР°Р»СЊРЅС‹Р№ РєРѕРґ РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.</p>
            )}
          </div>

          {referral && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Р РµС„РµСЂР°Р»СЊРЅР°СЏ СЃСЃС‹Р»РєР°</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyReferralLink}
                  className="inline-flex items-center justify-center px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  РЎРєРѕРїРёСЂРѕРІР°С‚СЊ СЃСЃС‹Р»РєСѓ
                </button>
                <span className="text-sm text-gray-500 break-all">{referral.linkPath}</span>
              </div>
              {referralMessage && (
                <p className="mt-3 text-sm text-green-700">{referralMessage}</p>
              )}
              {referral.recentInvites.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">РџРѕСЃР»РµРґРЅРёРµ РїРµСЂРµС…РѕРґС‹ РїРѕ РІР°С€РµР№ СЃСЃС‹Р»РєРµ</p>
                  <ul className="space-y-1">
                    {referral.recentInvites.slice(0, 3).map((invite) => (
                      <li key={invite.id} className="text-sm text-gray-500">
                        {invite.email} В· {invite.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {orders && orders.total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">РСЃС‚РѕСЂРёСЏ Р·Р°РєР°Р·РѕРІ</p>
              <div className="space-y-3">
                {orders.items.map((order) => {
                  const detail = orderDetails[order.id];
                  const expanded = expandedOrderId === order.id;

                  return (
                    <div key={order.id} className="rounded-xl border border-gray-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleOrder(order.id)}
                        className="w-full text-left"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {ORDER_STATUS_LABELS[order.status] ?? order.status}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {order.totalRubles.toLocaleString('ru-RU')} в‚Ѕ
                          </p>
                        </div>
                      </button>

                      {expanded && (
                        <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                          {orderDetailsLoadingId === order.id ? (
                            <p className="text-xs text-gray-400">Р—Р°РіСЂСѓР¶Р°РµРј РґРµС‚Р°Р»Рё Р·Р°РєР°Р·Р°...</p>
                          ) : detail ? (
                            <>
                              {detail.payment && (
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-500">
                                    РџР»Р°С‚С‘Р¶: {PAYMENT_STATUS_LABELS[detail.payment.status] ?? detail.payment.status}
                                    {' '}В· {detail.payment.amountRubles.toLocaleString('ru-RU')} в‚Ѕ
                                  </p>
                                  {detail.payment.resumePaymentUrl && (
                                    <button
                                      type="button"
                                      onClick={() => handleResumePayment(detail.payment!.resumePaymentUrl!)}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                                    >
                                      <ShoppingBag className="h-3.5 w-3.5" />
                                      РџСЂРѕРґРѕР»Р¶РёС‚СЊ РѕРїР»Р°С‚Сѓ
                                    </button>
                                  )}
                                </div>
                              )}
                              <ul className="space-y-1">
                                {detail.items.map((item) => (
                                  <li key={`${order.id}-${item.materialId}`} className="text-xs text-gray-500">
                                    {item.title} В· {item.priceRubles.toLocaleString('ru-RU')} в‚Ѕ
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <p className="text-xs text-red-500">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґРµС‚Р°Р»Рё Р·Р°РєР°Р·Р°.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

                    {/* Author applications */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {"\u0410\u0432\u0442\u043e\u0440\u0441\u043a\u0438\u0435 \u0437\u0430\u044f\u0432\u043a\u0438"}{authorApplications && authorApplications.total > 0 ? ` (${authorApplications.total})` : ''}
              </p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">{"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430..."}</p>
            ) : authorApplications && authorApplications.total > 0 ? (
              <ul className="space-y-2">
                {authorApplications.items.map((application) => (
                  <li key={application.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-block px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                      application.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : application.status === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {AUTHOR_STATUS_LABELS[application.status] ?? application.status}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700">
                        {application.employmentType === 'individual_entrepreneur'
                          ? "\u0418\u041f"
                          : "\u0421\u0430\u043c\u043e\u0437\u0430\u043d\u044f\u0442\u043e\u0441\u0442\u044c"}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(application.createdAt)}</p>
                      {application.sampleUrl && (
                        <a
                          href={application.sampleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-1 text-xs font-medium text-blue-500 hover:text-blue-600"
                        >
                          {"\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043f\u0440\u0438\u043c\u0435\u0440 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u0430 \u2192"}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">{"\u0412\u0430\u0448\u0438 \u0430\u0432\u0442\u043e\u0440\u0441\u043a\u0438\u0435 \u0437\u0430\u044f\u0432\u043a\u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c \u043f\u043e\u0441\u043b\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438."}</p>
            )}
          </div>

          {/* Document requests */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Р—Р°СЏРІРєРё РЅР° РґРѕРєСѓРјРµРЅС‚С‹{docs && docs.total > 0 ? ` (${docs.total})` : ''}
              </p>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400">Р—Р°РіСЂСѓР·РєР°...</p>
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
              <p className="text-sm text-gray-500">Р—Р°СЏРІРєРё РЅР° РґРѕРєСѓРјРµРЅС‚С‹ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ</p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">РџРµСЂРµР№С‚Рё Рє РјР°С‚РµСЂРёР°Р»Р°Рј</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/materialy"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Р’СЃРµ РјР°С‚РµСЂРёР°Р»С‹
            </Link>
            <Link
              href="/materialy/besplatno"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              Р‘РµСЃРїР»Р°С‚РЅС‹Рµ
            </Link>
            <Link
              href="/materialy/podpiska"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              РџРѕ РїРѕРґРїРёСЃРєРµ
            </Link>
            <Link
              href="/materialy/magazin"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              РњР°РіР°Р·РёРЅ
            </Link>
          </div>
        </div>

        {/* Admin block вЂ” visible only to admins */}
        {summary?.user?.isAdmin && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">РђРґРјРёРЅРёСЃС‚СЂРёСЂРѕРІР°РЅРёРµ</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                РџР°РЅРµР»СЊ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°
              </Link>
              <Link
                href="/admin/material-files"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-200 hover:border-amber-300 text-amber-700 text-sm font-medium rounded-xl transition-colors"
              >
                Р¤Р°Р№Р»С‹ РјР°С‚РµСЂРёР°Р»РѕРІ
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


