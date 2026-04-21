'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function NovyyParolClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    token.length > 0 &&
    password.length >= 8 &&
    passwordsMatch &&
    !loading;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!token) {
      setError('Ссылка для восстановления недействительна.');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов.');
      return;
    }

    if (!passwordsMatch) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.error ?? 'Не удалось сохранить новый пароль. Попробуйте ещё раз.'
        );
        return;
      }

      router.push(data.redirectTo ?? '/vhod?passwordReset=success');
    } catch {
      setError(
        'Не удалось сохранить новый пароль. Проверьте соединение и попробуйте ещё раз.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Новый пароль
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Задайте новый пароль для входа в кабинет. Ссылка из письма работает ограниченное время.
        </p>

        {!token && (
          <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            Ссылка для восстановления недействительна.
          </div>
        )}

        {error && (
          <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Новый пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading}
              placeholder="Минимум 8 символов"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Повторите пароль
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading}
              placeholder="Ещё раз тот же пароль"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {!passwordsMatch && confirmPassword.length > 0 && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Пароли пока не совпадают.
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
            {loading ? 'Сохраняем пароль...' : 'Сохранить новый пароль'}
          </button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <div>
            <Link
              href="/vosstanovlenie-parolya"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Запросить новую ссылку
            </Link>
          </div>
          <div>
            <Link
              href="/vhod"
              className="text-sm font-medium text-gray-600 hover:text-gray-700"
            >
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
