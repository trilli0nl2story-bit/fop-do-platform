import { Users, Crown, UserCheck, TrendingUp } from 'lucide-react';
import { Card } from '../../components/Card';
import { loadProfile, loadReferralStats } from '../../lib/userProfile';

const stats = [
  { label: 'Всего пользователей', value: '1 248', icon: <Users className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600', change: '+37' },
  { label: 'Подписчиков', value: '184', icon: <Crown className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600', change: '+12' },
  { label: 'Авторов', value: '42', icon: <UserCheck className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600', change: '+3' },
  { label: 'Активных за 7 дней', value: '342', icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-sky-50', color: 'text-sky-600', change: '+8%' },
];

const hardcodedUsers = [
  { name: 'Иванова Мария', email: 'ivanova@mail.ru', role: 'Воспитатель', plan: 'Премиум', city: 'Москва', institution: 'МБДОУ №15', date: '15 марта', status: 'active' },
  { name: 'Козлова Анна', email: 'kozlova@yandex.ru', role: 'Методист', plan: 'Базовый', city: 'Казань', institution: 'МБДОУ №7', date: '15 марта', status: 'active' },
  { name: 'Смирнова Елена', email: 'smirnova@gmail.com', role: 'Специалист', plan: 'Премиум', city: 'Санкт-Петербург', institution: 'ДОУ №3', date: '14 марта', status: 'active' },
  { name: 'Петрова Ольга', email: 'petrova@mail.ru', role: 'Заведующая', plan: 'Базовый', city: 'Екатеринбург', institution: 'МБДОУ №22', date: '14 марта', status: 'active' },
  { name: 'Сидорова Наталья', email: 'sidorova@mail.ru', role: 'Воспитатель', plan: 'Базовый', city: 'Нижний Новгород', institution: 'ДОУ №8', date: '13 марта', status: 'inactive' },
  { name: 'Новикова Дарья', email: 'novikova@mail.ru', role: 'Тьютор', plan: 'Базовый', city: 'Новосибирск', institution: 'МБДОУ №11', date: '12 марта', status: 'active' },
];

const roleBreakdown = [
  { role: 'Воспитатель', count: 542, pct: 43 },
  { role: 'Специалист', count: 218, pct: 17 },
  { role: 'Старший воспитатель', count: 156, pct: 13 },
  { role: 'Методист', count: 124, pct: 10 },
  { role: 'Заведующая', count: 89, pct: 7 },
  { role: 'Психолог/логопед', count: 67, pct: 5 },
  { role: 'Тьютор', count: 32, pct: 3 },
  { role: 'Помощник', count: 20, pct: 2 },
];

export function AdminUsers() {
  const lsProfile = loadProfile();
  const lsReferral = loadReferralStats(false);

  const hasSub = lsReferral.subscriptionDiscount > 0;

  const currentUserRow = {
    name: lsProfile.name,
    email: lsProfile.email,
    role: lsProfile.role,
    plan: hasSub ? 'Премиум' : 'Базовый',
    city: lsProfile.city || '—',
    institution: lsProfile.institution || '—',
    date: 'Сейчас',
    status: 'active',
    referralCode: lsReferral.referralCode,
    invitedCount: lsReferral.invitedCount,
    paidReferralCount: lsReferral.paidReferralCount,
    baseDiscount: lsReferral.baseDiscount,
    referralDiscount: lsReferral.referralDiscount,
    subscriptionDiscount: lsReferral.subscriptionDiscount,
    appliedDiscount: lsReferral.appliedDiscount,
    isCurrentUser: true,
  };

  const allUsers = [
    currentUserRow,
    ...hardcodedUsers.map(u => ({
      ...u,
      referralCode: '—',
      invitedCount: 0,
      paidReferralCount: 0,
      baseDiscount: 5,
      referralDiscount: 5,
      subscriptionDiscount: u.plan === 'Премиум' ? 25 : 0,
      appliedDiscount: u.plan === 'Премиум' ? 25 : 5,
      isCurrentUser: false,
    })),
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Пользователи</h1>
        <p className="text-gray-600 text-sm">Управление пользователями платформы</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <Card key={i} hover={false}>
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{s.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{s.label}</p>
              <span className="text-xs text-green-600 font-semibold">{s.change}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card hover={false}>
            <h2 className="font-semibold text-gray-900 mb-4">Пользователи</h2>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3">Пользователь</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden sm:table-cell">Город / Учреждение</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3">Тариф</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden md:table-cell">Скидка</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden lg:table-cell">Рефералов</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map((u, i) => (
                    <tr key={i} className={u.isCurrentUser ? 'bg-blue-50/50' : ''}>
                      <td className="py-3 pr-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            {u.isCurrentUser && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">вы</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{u.email}</p>
                          <p className="text-xs text-gray-400">{u.role}</p>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-gray-600 hidden sm:table-cell">
                        <p>{u.city}</p>
                        <p className="text-gray-400 truncate max-w-[120px]">{u.institution}</p>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.plan === 'Премиум' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                        }`}>{u.plan}</span>
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-blue-600">{u.appliedDiscount}%</span>
                          {u.referralDiscount > u.baseDiscount && (
                            <span className="text-xs text-gray-400">ref: {u.referralDiscount}%</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 hidden lg:table-cell">
                        <div className="text-xs">
                          <p className="text-gray-700">{u.invitedCount} приглашено</p>
                          <p className="text-green-600 font-medium">{u.paidReferralCount} оплачено</p>
                          {u.referralCode !== '—' && (
                            <p className="text-gray-400 font-mono">{u.referralCode}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`w-2 h-2 rounded-full inline-block ${u.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 mb-4">По ролям</h2>
          <div className="space-y-3">
            {roleBreakdown.map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{r.role}</span>
                  <span className="text-gray-500 text-xs">{r.count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
