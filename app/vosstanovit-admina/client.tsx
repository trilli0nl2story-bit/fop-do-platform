'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RECOVERY_EMAIL = 'urustau@gmail.com';

export function VosstanovitAdminaClient() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    password.trim().length >= 10 &&
    recoveryCode.trim().length > 0 &&
    !loading;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: RECOVERY_EMAIL,
          password,
          recoveryCode,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.error || 'Не удалось восстановить админ-доступ. Проверьте код и попробуйте ещё раз.'
        );
        return;
      }

      router.push(data.redirectTo || '/admin');
      router.refresh();
    } catch {
      setError('Не удалось восстановить админ-доступ. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Восстановление админ-доступа
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Для аккаунта <span className="font-medium text-gray-900">{RECOVERY_EMAIL}</span> можно
          задать новый пароль и сразу войти в админку. Используйте временный recovery-код из Replit Secrets.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={RECOVERY_EMAIL}
              readOnly
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Новый пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Не короче 10 символов"
              autoComplete="new-password"
              disabled={loading}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recovery-код
            </label>
            <input
              type="password"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
              placeholder="Код из Replit Secrets"
              disabled={loading}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

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
            {loading ? 'Восстанавливаем доступ...' : 'Войти как администратор'}
          </button>
        </form>
      </div>
    </div>
  );
}
