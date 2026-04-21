'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  TurnstileField,
  isTurnstileEnabled,
} from '@/src/components/TurnstileField';

export function VosstanovlenieParolyaClient() {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const captchaRequired = isTurnstileEnabled();
  const canSubmit =
    email.trim().length > 0 &&
    (!captchaRequired || captchaToken.trim().length > 0) &&
    !loading;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          captchaToken,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.error ?? 'Не удалось отправить письмо. Попробуйте ещё раз.'
        );
        return;
      }

      setMessage(
        data.message ??
          'Если аккаунт с таким email существует, письмо уже отправлено.'
      );
    } catch {
      setError(
        'Не удалось отправить письмо. Проверьте соединение и попробуйте ещё раз.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Восстановление доступа
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Введите email от кабинета. Мы отправим ссылку, по которой можно задать новый пароль.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vashemail@example.com"
              autoComplete="email"
              disabled={loading}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <TurnstileField value={captchaToken} onChange={setCaptchaToken} />

          {message && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              {message}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
              canSubmit
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Отправляем письмо...' : 'Отправить ссылку'}
          </button>
        </form>

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
