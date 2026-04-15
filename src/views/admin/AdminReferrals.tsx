import { Share2, Users, Crown, TrendingUp } from 'lucide-react';
import { Card } from '../../components/Card';

const stats = [
  { label: 'Всего рефералов', value: '312', icon: <Share2 className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600' },
  { label: 'Активных рефереров', value: '89', icon: <Users className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600' },
  { label: 'Конверсия в подписку', value: '22%', icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600' },
  { label: 'Выдано премиумов', value: '34', icon: <Crown className="w-5 h-5" />, bg: 'bg-sky-50', color: 'text-sky-600' },
];

const topReferrers = [
  { name: 'Козлова Анна', invited: 23, converted: 8, reward: '3 месяца Премиум' },
  { name: 'Петрова Ольга', invited: 15, converted: 5, reward: '3 месяца Премиум' },
  { name: 'Иванова Мария', invited: 10, converted: 3, reward: '3 месяца Премиум' },
  { name: 'Сидорова Наталья', invited: 7, converted: 2, reward: '1 месяц Премиум' },
  { name: 'Смирнова Елена', invited: 3, converted: 1, reward: '7 дней Премиум' },
];

export function AdminReferrals() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Рефералы</h1>
        <p className="text-gray-600 text-sm">Статистика реферальной программы</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <Card key={i} hover={false}>
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 mb-4">Распределение по уровням</h2>
          <div className="space-y-3">
            {[
              { level: '3 приглашения', count: 45, pct: 50, color: 'bg-green-300' },
              { level: '5 приглашений', count: 28, pct: 31, color: 'bg-green-400' },
              { level: '10 приглашений', count: 12, pct: 13, color: 'bg-green-500' },
              { level: '20 приглашений', count: 3, pct: 3, color: 'bg-green-600' },
              { level: '50 приглашений', count: 1, pct: 1, color: 'bg-green-700' },
            ].map((l, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{l.level}</span>
                  <span className="text-gray-500">{l.count} чел.</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${l.color} rounded-full`} style={{ width: `${Math.max(l.pct, 2)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 mb-4">Метрики</h2>
          <div className="space-y-4">
            {[
              { label: 'Среднее приглашений на реферера', value: '3.5' },
              { label: 'Конверсия приглашённых в регистрацию', value: '67%' },
              { label: 'Конверсия в подписку', value: '22%' },
              { label: 'Стоимость привлечения', value: '0 ₽' },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{m.label}</span>
                <span className="text-sm font-bold text-gray-900">{m.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card hover={false}>
        <h2 className="font-semibold text-gray-900 mb-4">Топ рефереров</h2>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Пользователь</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Приглашено</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Конверсия</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Награда</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topReferrers.map((r, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm font-medium text-gray-900">{r.name}</td>
                  <td className="py-3 text-sm text-gray-600">{r.invited}</td>
                  <td className="py-3 text-sm text-gray-600">{r.converted} подписок</td>
                  <td className="py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{r.reward}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
