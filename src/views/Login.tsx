import { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface LoginProps {
  onNavigate: (page: string) => void;
  onLogin: () => void;
}

export function Login({ onNavigate, onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход в систему</h1>
          <p className="text-gray-600">Введите ваши данные для входа</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="ваш@email.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              label="Пароль"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" size="lg">
              Войти
            </Button>
          </form>

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
