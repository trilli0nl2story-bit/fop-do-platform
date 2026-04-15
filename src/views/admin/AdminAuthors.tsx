import { TrendingUp, FileText, DollarSign, Users, Eye } from 'lucide-react';
import { Card } from '../../components/Card';

const stats = [
  { label: 'Всего авторов', value: '42', icon: <Users className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600', change: '+3' },
  { label: 'Документов авторов', value: '318', icon: <FileText className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600', change: '+12' },
  { label: 'Выплачено за месяц', value: '84 200 ₽', icon: <DollarSign className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600', change: '+8%' },
  { label: 'Средний доход автора', value: '2 005 ₽', icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-sky-50', color: 'text-sky-600', change: '+5%' },
];

const authors = [
  { name: 'Петрова Ольга', docs: 45, sales: 312, revenue: 24800, rate: '30%', status: 'active' },
  { name: 'Козлова Анна', docs: 28, sales: 189, revenue: 16400, rate: '30%', status: 'active' },
  { name: 'Сидорова Наталья', docs: 12, sales: 87, revenue: 6200, rate: '25%', status: 'active' },
  { name: 'Иванова Мария', docs: 8, sales: 34, revenue: 2100, rate: '25%', status: 'active' },
  { name: 'Смирнова Елена', docs: 3, sales: 5, revenue: 380, rate: '25%', status: 'moderation' },
];

export function AdminAuthors() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Авторы</h1>
        <p className="text-gray-600 text-sm">Управление авторами и выплатами</p>
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

      <Card hover={false}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Список авторов</h2>
          <span className="text-sm text-gray-500">{authors.length} авторов</span>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Автор</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Документов</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Продаж</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Выручка</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Ставка</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {authors.map((a, i) => (
                <tr key={i}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">
                        {a.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{a.docs}</td>
                  <td className="py-3 text-sm text-gray-600">{a.sales}</td>
                  <td className="py-3 text-sm font-medium text-green-600">{a.revenue.toLocaleString()} ₽</td>
                  <td className="py-3 text-sm font-semibold text-gray-900">{a.rate}</td>
                  <td className="py-3">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Eye className="w-4 h-4" /></button>
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
