import { useState } from 'react';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { Check, Download } from 'lucide-react';
import { saveProfile, loadProfile } from '../lib/userProfile';

interface RegisterProps {
  onNavigate: (page: string) => void;
  onRegister: () => void;
  downloadContext?: boolean;
}

const ROLES = [
  { value: 'educator', label: 'Воспитатель' },
  { value: 'specialist', label: 'Специалист' },
  { value: 'senior-educator', label: 'Старший воспитатель' },
  { value: 'methodist', label: 'Методист' },
  { value: 'head', label: 'Заведующая' },
];

const SERVER_NOT_READY = 'Сервер авторизации ещё не настроен. Попробуйте позже.';

export function Register({ onNavigate, onRegister, downloadContext }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    city.trim().length > 0 &&
    selectedRole !== '' &&
    consentGiven &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);

    const roleLabel = ROLES.find(r => r.value === selectedRole)?.label ?? selectedRole;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: roleLabel,
          city: city.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status >= 500) {
          setError(SERVER_NOT_READY);
        } else {
          setError(data.error ?? 'Не удалось создать аккаунт. Попробуйте позже.');
        }
        return;
      }

      // Keep localStorage profile as a compatibility cache for pages
      // that still read from it (will be removed in a later migration step).
      const existing = loadProfile();
      saveProfile({
        ...existing,
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
        role: roleLabel,
      });

      onRegister();
      onNavigate('dashboard');
    } catch {
      setError('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Создайте кабинет за 30 секунд
          </h1>
          <p className="text-gray-500 text-sm">
            Подберём материалы под вашу роль и сохраним доступ к скачанному
          </p>
        </div>

        {downloadContext && (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
            <Download className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              После регистрации материал будет доступен для скачивания
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Имя *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Например, Мария"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Должность *</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    disabled={loading}
                    onClick={() => setSelectedRole(role.value)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
                      selectedRole === role.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    } disabled:opacity-60`}
                  >
                    {selectedRole === role.value && <Check className="w-3 h-3" />}
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Город *</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Например, Казань"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ваш@email.ru"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Пароль *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:opacity-60"
              />
            </div>

            <ConsentCheckbox
              checked={consentGiven}
              onChange={setConsentGiven}
              onNavigate={onNavigate}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all ${
                canSubmit
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Создание аккаунта...' : 'Создать кабинет'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
