'use client';

import { useEffect, useState } from 'react';
import { Loader2, Share2, Users } from 'lucide-react';

interface ReferralProfileItem {
  userId: string;
  referralCode: string;
  discountPercent: number;
  userEmail: string;
  registeredCount: number;
  paidCount: number;
}

interface ReferralClaimItem {
  id: string;
  referralCode: string;
  discountPercent: number;
  status: string;
  updatedAt: string;
  orderId: string | null;
  referrerEmail: string;
  referredEmail: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReferralsManager() {
  const [profiles, setProfiles] = useState<ReferralProfileItem[]>([]);
  const [claims, setClaims] = useState<ReferralClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch('/api/admin/referrals', {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setProfiles(Array.isArray(data?.profiles) ? data.profiles : []);
        setClaims(Array.isArray(data?.claims) ? data.claims : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('Не удалось загрузить реферальную систему. Обновите страницу.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Рефералы</h1>
        <p className="text-sm text-gray-500">Коды, приглашения и первые оплаченные заказы по реферальной скидке.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-40 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="grid xl:grid-cols-2 gap-5">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Профили реферальной программы</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {profiles.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">Профили пока не созданы.</div>
              ) : profiles.map((profile) => (
                <div key={profile.userId} className="p-4 space-y-1">
                  <p className="text-sm font-semibold text-gray-900 break-all">{profile.userEmail}</p>
                  <p className="text-xs text-gray-500 tracking-wide">{profile.referralCode}</p>
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 font-medium">
                      Скидка {profile.discountPercent}%
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                      Зарегистрировались: {profile.registeredCount}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                      Оплатили: {profile.paidCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Последние активации</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {claims.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">Активаций пока нет.</div>
              ) : claims.map((claim) => (
                <div key={claim.id} className="p-4 space-y-1">
                  <p className="text-sm font-semibold text-gray-900 break-all">{claim.referredEmail}</p>
                  <p className="text-xs text-gray-500 break-all">По коду {claim.referralCode} от {claim.referrerEmail}</p>
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                      {claim.status}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                      Скидка {claim.discountPercent}%
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 font-medium">
                      {formatDate(claim.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
