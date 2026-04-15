import { useState } from 'react';
import { Package, DollarSign, Clock, CheckCircle, Eye, TrendingUp } from 'lucide-react';
import { Card } from '../../components/Card';

type OrderStatus = 'paid' | 'processing' | 'completed' | 'refunded';

const stats = [
  { label: 'Заказов сегодня', value: '12', icon: <Package className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600' },
  { label: 'Выручка за день', value: '14 280 ₽', icon: <DollarSign className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600' },
  { label: 'В обработке', value: '3', icon: <Clock className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600' },
  { label: 'Средний чек', value: '342 ₽', icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-sky-50', color: 'text-sky-600' },
];

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  paid: { label: 'Оплачен', color: 'bg-blue-50 text-blue-600' },
  processing: { label: 'В обработке', color: 'bg-amber-50 text-amber-600' },
  completed: { label: 'Завершён', color: 'bg-green-50 text-green-600' },
  refunded: { label: 'Возврат', color: 'bg-red-50 text-red-600' },
};

const initialOrders = [
  { id: 'ORD-2024-048', user: 'Иванова Мария', docs: ['Конспект занятия', 'Методические рекомендации'], amount: 369, status: 'paid' as OrderStatus, paymentStatus: 'Оплачен', date: '15 марта, 14:30' },
  { id: 'ORD-2024-047', user: 'Козлова Анна', docs: ['Рабочая программа по ФОП ДО'], amount: 390, status: 'completed' as OrderStatus, paymentStatus: 'Оплачен', date: '15 марта, 12:15' },
  { id: 'ORD-2024-046', user: 'Смирнова Елена', docs: ['Диагностика речевого развития'], amount: 180, status: 'processing' as OrderStatus, paymentStatus: 'Оплачен', date: '15 марта, 10:45' },
  { id: 'ORD-2024-045', user: 'Петрова Ольга', docs: ['Сценарий праздника', 'Картотека игр'], amount: 419, status: 'completed' as OrderStatus, paymentStatus: 'Оплачен', date: '14 марта, 16:20' },
  { id: 'ORD-2024-044', user: 'Сидорова Наталья', docs: ['Конспект по экологии'], amount: 149, status: 'refunded' as OrderStatus, paymentStatus: 'Возвращён', date: '14 марта, 09:10' },
];

export function AdminOrders() {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Заказы</h1>
        <p className="text-gray-600 text-sm">Управление заказами и оплатами</p>
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

      <Card hover={false}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {([['all', 'Все'], ['paid', 'Оплаченные'], ['processing', 'В обработке'], ['completed', 'Завершённые'], ['refunded', 'Возвраты']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === val ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((order) => {
            const st = statusConfig[order.status];
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{order.id}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{order.user} · {order.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-lg font-bold text-gray-900">{order.amount} ₽</span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="pt-3 mb-3">
                      <p className="text-xs text-gray-500 mb-2">Документы:</p>
                      <ul className="space-y-1">
                        {order.docs.map((doc, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Оплата: <span className="font-medium text-gray-700">{order.paymentStatus}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.status !== 'completed' && order.status !== 'refunded' && (
                        <button
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Завершить
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => updateStatus(order.id, 'paid')}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Отметить оплаченным
                        </button>
                      )}
                      {order.status !== 'refunded' && (
                        <button
                          onClick={() => updateStatus(order.id, 'refunded')}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                        >
                          Возврат
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
