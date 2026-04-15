import { Crown, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Card } from '../../components/Card';

const stats = [
  { label: 'Активных подписок', value: '184', icon: <Crown className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600', change: '+12' },
  { label: 'Новых за месяц', value: '37', icon: <Users className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600', change: '+8' },
  { label: 'Доход с подписок', value: '142 600 ₽', icon: <DollarSign className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600', change: '+14%' },
  { label: 'Средний чек', value: '774 ₽', icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-sky-50', color: 'text-sky-600', change: '+2%' },
];

const planBreakdown = [
  { plan: '1 месяц', count: 48, pct: 26, color: 'bg-gray-300' },
  { plan: '3 месяца', count: 72, pct: 39, color: 'bg-blue-400' },
  { plan: '6 месяцев', count: 38, pct: 21, color: 'bg-blue-500' },
  { plan: '12 месяцев', count: 26, pct: 14, color: 'bg-blue-600' },
];

const subscribers = [
  { name: 'Иванова Мария', plan: '3 месяца', started: '15 янв 2024', expires: '15 апр 2024', status: 'active' },
  { name: 'Козлова Анна', plan: '12 месяцев', started: '1 фев 2024', expires: '1 фев 2025', status: 'active' },
  { name: 'Смирнова Елена', plan: '1 месяц', started: '28 фев 2024', expires: '28 мар 2024', status: 'expiring' },
  { name: 'Петрова Ольга', plan: '6 месяцев', started: '10 дек 2023', expires: '10 июн 2024', status: 'active' },
  { name: 'Сидорова Наталья', plan: '3 месяца', started: '1 янв 2024', expires: '1 апр 2024', status: 'active' },
];

export function AdminSubscriptions() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Подписки</h1>
        <p className="text-gray-600 text-sm">Статистика и управление подписками</p>
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

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 mb-4">Распределение по тарифам</h2>
          <div className="space-y-3">
            {planBreakdown.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{p.plan}</span>
                  <span className="text-gray-500">{p.count} ({p.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 mb-4">Конверсия</h2>
          <div className="space-y-4">
            {[
              { label: 'Регистрация → Подписка', value: '18%' },
              { label: 'Пробный → Платный', value: '32%' },
              { label: 'Продление подписки', value: '74%' },
              { label: 'Апгрейд тарифа', value: '12%' },
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
        <h2 className="font-semibold text-gray-900 mb-4">Последние подписчики</h2>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Пользователь</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Тариф</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden sm:table-cell">Начало</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden sm:table-cell">Окончание</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.map((s, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 text-sm text-gray-600">{s.plan}</td>
                  <td className="py-3 text-sm text-gray-500 hidden sm:table-cell">{s.started}</td>
                  <td className="py-3 text-sm text-gray-500 hidden sm:table-cell">{s.expires}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {s.status === 'active' ? 'Активна' : 'Истекает'}
                    </span>
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
