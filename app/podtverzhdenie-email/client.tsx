'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function PodtverzhdenieEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!token) {
      setError('Ссылка подтверждения недействительна.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.error ?? 'Не удалось подтвердить email. Попробуйте запросить новое письмо.'
        );
        return;
      }

      router.push(data.redirectTo ?? '/vhod?emailVerification=success');
    } catch {
      setError('Не удалось подтвердить email. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Подтверждение email
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Нажмите кнопку ниже, чтобы завершить подтверждение почты и активировать аккаунт.
        </p>

        {!token && (
          <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            Ссылка подтверждения недействительна.
          </div>
        )}

        {error && (
          <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!token || loading}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
            !token || loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Подтверждаем...' : 'Подтвердить email'}
        </button>

        <div className="mt-5 text-center">
          <Link
            href="/vhod"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}
