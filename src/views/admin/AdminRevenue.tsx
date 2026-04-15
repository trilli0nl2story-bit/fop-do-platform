import { DollarSign, TrendingUp, ShoppingCart, Crown } from 'lucide-react';
import { Card } from '../../components/Card';

const stats = [
  { label: 'Выручка сегодня', value: '14 280 ₽', icon: <DollarSign className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600', change: '+12%' },
  { label: 'За 30 дней', value: '284 600 ₽', icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600', change: '+8%' },
  { label: 'Продажи документов', value: '186 400 ₽', icon: <ShoppingCart className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600', change: '+10%' },
  { label: 'Подписки', value: '98 200 ₽', icon: <Crown className="w-5 h-5" />, bg: 'bg-sky-50', color: 'text-sky-600', change: '+15%' },
];

const monthlyData = [
  { month: 'Октябрь', revenue: 142000, orders: 287 },
  { month: 'Ноябрь', revenue: 168000, orders: 314 },
  { month: 'Декабрь', revenue: 198000, orders: 356 },
  { month: 'Январь', revenue: 224000, orders: 398 },
  { month: 'Февраль', revenue: 256000, orders: 421 },
  { month: 'Март', revenue: 284600, orders: 448 },
];

const topDocs = [
  { title: 'Рабочая программа по ФОП ДО', sales: 89, revenue: 34710 },
  { title: 'Конспект "Осенние листья"', sales: 67, revenue: 9983 },
  { title: 'Адаптированная программа ЗПР', sales: 54, revenue: 24300 },
  { title: 'Сценарий "Новый год"', sales: 48, revenue: 13920 },
  { title: 'Диагностика речевого развития', sales: 41, revenue: 7380 },
];

export function AdminRevenue() {
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Выручка</h1>
        <p className="text-gray-600 text-sm">Финансовая статистика платформы</p>
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
          <h2 className="font-semibold text-gray-900 mb-4">Выручка по месяцам</h2>
          <div className="space-y-3">
            {monthlyData.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{d.month}</span>
                  <span className="text-gray-900 font-semibold">{(d.revenue / 1000).toFixed(0)}к ₽</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 mb-4">Топ документов по выручке</h2>
          <div className="space-y-3">
            {topDocs.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                    <p className="text-xs text-gray-500">{d.sales} продаж</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 flex-shrink-0 ml-3">{d.revenue.toLocaleString()} ₽</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card hover={false}>
        <h2 className="font-semibold text-gray-900 mb-4">Структура доходов</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Продажа документов', pct: 65, amount: '186 400 ₽', color: 'bg-blue-500' },
            { label: 'Подписки', pct: 28, amount: '98 200 ₽', color: 'bg-amber-500' },
            { label: 'Заказы', pct: 7, amount: '19 800 ₽', color: 'bg-green-500' },
          ].map((s, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 ${s.color} rounded-full`} />
                <span className="text-sm font-medium text-gray-700">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">{s.amount}</p>
              <p className="text-sm text-gray-500">{s.pct}% от общей выручки</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
