import { Bot, MessageSquare, FileText, LayoutTemplate, TrendingUp } from 'lucide-react';
import { Card } from '../../components/Card';

const stats = [
  { label: 'Запросов сегодня', value: '142', icon: <Bot className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600', change: '+18%' },
  { label: 'Режим "Спросить"', value: '812', icon: <MessageSquare className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600', change: '+12%' },
  { label: 'Режим "Создать"', value: '284', icon: <FileText className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600', change: '+25%' },
  { label: 'Режим "Шаблон"', value: '144', icon: <LayoutTemplate className="w-5 h-5" />, bg: 'bg-teal-50', color: 'text-teal-600', change: '+30%' },
];

const popularTemplates = [
  { name: 'Конспект занятия', uses: 89, pct: 62 },
  { name: 'Консультация для родителей', uses: 42, pct: 29 },
  { name: 'План работы', uses: 31, pct: 22 },
  { name: 'Диагностическая карта', uses: 24, pct: 17 },
  { name: 'Сценарий мероприятия', uses: 18, pct: 13 },
  { name: 'Характеристика', uses: 12, pct: 8 },
];

const recentQueries = [
  { user: 'Иванова М.', query: 'Конспект по экологии для старшей группы', mode: 'Создать', time: '5 мин назад' },
  { user: 'Козлова А.', query: 'Что нового в ФОП ДО 2024?', mode: 'Спросить', time: '12 мин назад' },
  { user: 'Петрова О.', query: 'Диагностическая карта — ТНР', mode: 'Шаблон', time: '18 мин назад' },
  { user: 'Смирнова Е.', query: 'План проекта "Весна"', mode: 'Создать', time: '24 мин назад' },
  { user: 'Сидорова Н.', query: 'Консультация "Готовность к школе"', mode: 'Шаблон', time: '31 мин назад' },
];

export function AdminAI() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI-запросы</h1>
        <p className="text-gray-600 text-sm">Статистика использования AI-помощника</p>
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
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Популярные шаблоны</h2>
          </div>
          <div className="space-y-3">
            {popularTemplates.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{t.name}</span>
                  <span className="text-gray-500">{t.uses} использований</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 mb-4">Метрики качества</h2>
          <div className="space-y-4">
            {[
              { label: 'Среднее время генерации', value: '3.2 сек' },
              { label: 'Использование "Сохранить"', value: '68%' },
              { label: 'Использование "Доработать"', value: '24%' },
              { label: 'Удовлетворённость', value: '4.2 / 5' },
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
        <h2 className="font-semibold text-gray-900 mb-4">Последние запросы</h2>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Пользователь</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Запрос</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Режим</th>
                <th className="text-left text-xs font-semibold text-gray-500 pb-3">Время</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentQueries.map((q, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{q.user}</td>
                  <td className="py-3 text-sm text-gray-600 max-w-[200px] truncate">{q.query}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      q.mode === 'Спросить' ? 'bg-blue-50 text-blue-600' :
                      q.mode === 'Создать' ? 'bg-amber-50 text-amber-600' :
                      'bg-teal-50 text-teal-600'
                    }`}>{q.mode}</span>
                  </td>
                  <td className="py-3 text-xs text-gray-500 whitespace-nowrap">{q.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
