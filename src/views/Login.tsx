import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface LoginProps {
  onNavigate: (page: string) => void;
  onLogin: () => void;
}

const SERVER_NOT_READY =
  'Сервер авторизации ещё не настроен. Попробуйте позже.';

export function Login({ onNavigate, onLogin }: LoginProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status >= 500) {
          setError(SERVER_NOT_READY);
        } else {
          setError(data.error ?? 'Не удалось войти. Проверьте данные.');
        }
        return;
      }

      onLogin();
      onNavigate('dashboard');
    } catch {
      setError(
        'Не удалось подключиться к серверу. Проверьте интернет-соединение.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Вход в систему
          </h1>
          <p className="text-gray-600">Введите ваши данные для входа</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          {searchParams.get('emailVerification') === 'success' && (
            <div className="mb-5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              Почта подтверждена. Теперь можно войти в аккаунт.
            </div>
          )}

          {searchParams.get('emailVerification') === 'invalid' && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              Ссылка подтверждения недействительна или уже устарела. Войдите в
              аккаунт и запросите новое письмо.
            </div>
          )}

          {searchParams.get('passwordReset') === 'success' && (
            <div className="mb-5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              Пароль обновлён. Теперь можно войти с новым паролем.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="ваш@email.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
            <Input
              type="password"
              label="Пароль"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => onNavigate('forgot-password')}
              className="text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              Забыли пароль?
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('register')}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Нет аккаунта? Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
