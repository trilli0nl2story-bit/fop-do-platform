import { useState } from 'react';
import {
  User, Mail, Briefcase, Crown, LogOut, CalendarDays, CheckCircle, Bot, Zap,
  Lock, MapPin, Building2, Copy, Check, Send, Share2, ChevronRight, Users,
  TrendingUp, Shield, Gift
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  loadProfile, saveProfile, loadReferralStats, REFERRAL_MILESTONES,
  UserProfile
} from '../lib/userProfile';

interface ProfileProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  hasSubscription?: boolean;
}

const ROLES = ['Воспитатель', 'Специалист', 'Старший воспитатель', 'Методист', 'Заведующая'];

type TabId = 'personal' | 'security' | 'subscription' | 'referral';

const TABS: { id: TabId; label: string }[] = [
  { id: 'personal', label: 'Личные данные' },
  { id: 'security', label: 'Безопасность' },
  { id: 'subscription', label: 'Подписка' },
  { id: 'referral', label: 'Реферальная программа' },
];

export function Profile({ onNavigate, onLogout, hasSubscription = true }: ProfileProps) {
  const [tab, setTab] = useState<TabId>('personal');
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [copied, setCopied] = useState(false);

  const referral = loadReferralStats(hasSubscription);

  const initials = profile.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0] || '')
    .join('');

  const handleProfileSave = () => {
    saveProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordSave = () => {
    setPasswordError('');
    if (!currentPassword) { setPasswordError('Введите текущий пароль'); return; }
    if (newPassword.length < 6) { setPasswordError('Новый пароль: минимум 6 символов'); return; }
    if (newPassword !== repeatPassword) { setPasswordError('Пароли не совпадают'); return; }
    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setRepeatPassword('');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const showCopyFeedback = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyReferralLink = () => {
    showCopyFeedback();
    try {
      const text = referral.referralLink;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch (_) {}
  };

  const handleLogout = () => {
    onLogout();
    onNavigate('landing');
  };

  const paidCount = referral.paidReferralCount;
  const nextMilestone = REFERRAL_MILESTONES.find(m => paidCount < m.count);
  const progressPct = nextMilestone
    ? Math.min(100, Math.round((paidCount / nextMilestone.count) * 100))
    : 100;

  const discountLabel = () => {
    if (hasSubscription && referral.subscriptionDiscount >= referral.referralDiscount) {
      return `${referral.subscriptionDiscount}%`;
    }
    return `${referral.appliedDiscount}%`;
  };

  const discountNote = () => {
    if (hasSubscription) {
      return referral.referralDiscount > referral.baseDiscount
        ? `Применена скидка по подписке. Реферальная скидка: ${referral.referralDiscount}% — сохранится и будет работать, если подписка закончится.`
        : 'Применена скидка по подписке.';
    }
    if (paidCount === 0) {
      return 'Приглашайте коллег, которые оформят покупку, и увеличивайте скидку до 10%.';
    }
    return `Реферальная скидка активна. Пригласите ещё коллег, чтобы увеличить её.`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name || 'Профиль'}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
        <div className="sm:ml-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              tab === t.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <Card hover={false}>
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Личные данные</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Имя и фамилия</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    placeholder="ФИО"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    type="email"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Город</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={profile.city}
                    onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    placeholder="Москва"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Учебное заведение</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={profile.institution}
                    onChange={e => setProfile(p => ({ ...p, institution: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    placeholder='МБДОУ "Детский сад №1"'
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Роль / должность</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={profile.role}
                  onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white appearance-none"
                >
                  <option value="">— Выберите роль —</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> Сохранено
                </span>
              )}
              <Button onClick={handleProfileSave}>Сохранить изменения</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'security' && (
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Смена пароля</h2>
              <p className="text-sm text-gray-500">Обновите пароль для входа в аккаунт</p>
            </div>
          </div>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Текущий пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Новый пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  placeholder="Минимум 6 символов"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Повторите новый пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={e => setRepeatPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</p>
            )}
            {passwordSaved && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Пароль успешно изменён
              </p>
            )}
            <Button onClick={handlePasswordSave}>Изменить пароль</Button>
          </div>
        </Card>
      )}

      {tab === 'subscription' && (
        <div className="space-y-4">
          <Card hover={false}>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl mb-4 -mx-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{hasSubscription ? 'Премиум' : 'Базовый'}</h3>
                  <p className="text-sm text-gray-600">{hasSubscription ? '278 ₽ / месяц' : 'Бесплатный тариф'}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('subscription')}>
                {hasSubscription ? 'Управление' : 'Оформить'}
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <CalendarDays className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Активна до</p>
                  <p className="text-sm font-medium text-gray-900">{hasSubscription ? '15 сентября 2024' : '—'}</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${hasSubscription ? 'bg-green-50' : 'bg-gray-50'}`}>
                <CheckCircle className={`w-5 h-5 flex-shrink-0 ${hasSubscription ? 'text-green-500' : 'text-gray-300'}`} />
                <div>
                  <p className="text-xs text-gray-500">Статус</p>
                  <p className={`text-sm font-medium ${hasSubscription ? 'text-green-700' : 'text-gray-500'}`}>
                    {hasSubscription ? 'Активна' : 'Не активна'}
                  </p>
                </div>
              </div>
            </div>

            {hasSubscription && (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">AI-запросы</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">15</p>
                      <p className="text-xs text-gray-500">Включено</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">7</p>
                      <p className="text-xs text-gray-500">Использовано</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">8</p>
                      <p className="text-xs text-gray-500">Осталось</p>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '47%' }} />
                  </div>
                  <button
                    onClick={() => onNavigate('subscription')}
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 mt-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Докупить запросы
                  </button>
                </div>

                <ul className="space-y-2 text-sm text-gray-600">
                  {['15 AI-запросов в месяц', 'Доступ к премиум-библиотеке', 'Скидка 25% на все покупки', 'Заказ документов'].map(b => (
                    <li key={b} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Автопродление: <span className="font-medium text-gray-700">включено</span></span>
                  <button className="text-blue-500 hover:text-blue-600 font-medium text-xs">Отключить</button>
                </div>
              </>
            )}
          </Card>

          <Card hover={false}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Ваша скидка на магазин</h3>
              </div>
              <span className={`text-2xl font-bold ${hasSubscription ? 'text-amber-600' : 'text-blue-600'}`}>
                {discountLabel()}
              </span>
            </div>
            <p className="text-sm text-gray-500">{discountNote()}</p>
          </Card>
        </div>
      )}

      {tab === 'referral' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Приглашайте коллег — платите меньше за материалы</p>
                <p className="text-xs text-gray-500 mt-0.5">Скидка растёт, когда коллега делает оплаченную покупку</p>
              </div>
            </div>
            <div className="text-center sm:text-right flex-shrink-0">
              <p className="text-2xl font-bold text-blue-600">{discountLabel()}</p>
              <p className="text-xs text-gray-500">текущая скидка</p>
            </div>
          </div>

          {hasSubscription && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Сейчас активна скидка подписки ({referral.subscriptionDiscount}%). Реферальная скидка {referral.referralDiscount > referral.baseDiscount ? `(${referral.referralDiscount}%)` : ''} сохраняется и будет применена, если подписка закончится.
            </div>
          )}

          <Card hover={false}>
            <h3 className="font-semibold text-gray-900 mb-3">Ваша реферальная ссылка</h3>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-mono truncate">
                {referral.referralLink}
              </div>
              <button
                onClick={handleCopyReferralLink}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors flex-shrink-0 ${
                  copied ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <div
              aria-live="polite"
              className={`flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 overflow-hidden transition-all duration-200 ${
                copied ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0 py-0 mb-0 border-0'
              }`}
            >
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Ссылка скопирована — отправьте её коллегам</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Отправьте ссылку коллегам. Скидка растёт только когда коллега делает покупку.</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referral.referralLink)}&text=${encodeURIComponent('Присоединяйся к Методическому кабинету!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Присоединяйся! ' + referral.referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <a
                href={`https://vk.com/share.php?url=${encodeURIComponent(referral.referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                VK
              </a>
            </div>
          </Card>

          <Card hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Прогресс скидки</h3>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-gray-900">{paidCount}</span>
                <span className="text-xs text-gray-500">оплаченных рефералов</span>
              </div>
            </div>

            {nextMilestone && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>До скидки {nextMilestone.discount}%</span>
                  <span>{paidCount} / {nextMilestone.count}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2 font-medium">
                  До следующего уровня: ещё {nextMilestone.count - paidCount} оплаченных покупок по вашей ссылке
                </p>
              </div>
            )}

            <div className="space-y-2">
              {REFERRAL_MILESTONES.map((m, i) => {
                const reached = paidCount >= m.count;
                const isCurrent = !reached && (i === 0 || paidCount >= REFERRAL_MILESTONES[i - 1].count);
                return (
                  <div
                    key={m.count}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      reached
                        ? 'bg-green-50 border-green-200'
                        : isCurrent
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      reached ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}>
                      {reached ? <Check className="w-4 h-4" /> : m.count}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${reached ? 'text-green-800' : 'text-gray-900'}`}>
                        {m.count} {m.count < 5 ? 'оплаченных реферала' : 'оплаченных рефералов'}
                      </p>
                      <p className={`text-xs ${reached ? 'text-green-600' : 'text-gray-500'}`}>
                        Скидка на магазин: {m.discount}%
                      </p>
                    </div>
                    {reached ? (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Достигнуто</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
              Реферальная скидка сохраняется в профиле. Позже здесь появится срок активности скидки.
            </p>
          </Card>

          <Card hover={false} className="bg-gray-50">
            <p className="text-xs text-gray-500 font-medium mb-1">Что считается оплаченным рефералом?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Коллега, который зарегистрировался по вашей ссылке <strong>и</strong> сделал хотя бы одну оплаченную покупку. Простая регистрация без покупки не увеличивает скидку.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
