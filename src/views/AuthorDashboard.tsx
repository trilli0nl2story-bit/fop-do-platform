import { useState } from 'react';
import { UploadCloud, FileText, TrendingUp, DollarSign, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Select } from '../components/Select';

export function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'upload'>('overview');
  const [uploadForm, setUploadForm] = useState({ title: '', category: '', description: '' });

  const stats = [
    { label: 'Загружено документов', value: '24', icon: <FileText className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Всего продаж', value: '147', icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Доход (этот месяц)', value: '8 240 ₽', icon: <DollarSign className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Просмотров', value: '3 412', icon: <Eye className="w-5 h-5" />, color: 'text-sky-500', bg: 'bg-sky-50' }
  ];

  const myDocuments = [
    { id: 1, title: 'Конспект занятия "Осенние листья"', category: 'Планы занятий', sales: 45, revenue: 6705, status: 'published', views: 234 },
    { id: 2, title: 'Диагностика речевого развития', category: 'Диагностика', sales: 28, revenue: 5040, status: 'published', views: 189 },
    { id: 3, title: 'Рабочая программа (Средняя группа)', category: 'Программы', sales: 0, revenue: 0, status: 'moderation', views: 12 },
    { id: 4, title: 'Картотека подвижных игр', category: 'Методички', sales: 0, revenue: 0, status: 'draft', views: 0 }
  ];

  const categoryOptions = [
    { value: '', label: 'Выберите категорию' },
    { value: 'plans', label: 'Планы занятий' },
    { value: 'programs', label: 'Программы' },
    { value: 'methodical', label: 'Методички' },
    { value: 'diagnostics', label: 'Диагностика' },
    { value: 'scenarios', label: 'Сценарии' }
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    published: { label: 'Опубликован', color: 'text-green-600 bg-green-50', icon: <CheckCircle className="w-4 h-4" /> },
    moderation: { label: 'На проверке', color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-4 h-4" /> },
    draft: { label: 'Черновик', color: 'text-gray-600 bg-gray-100', icon: <AlertCircle className="w-4 h-4" /> }
  };

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'documents', label: 'Мои документы' },
    { id: 'upload', label: 'Загрузить' }
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Кабинет автора</h1>
            <p className="text-gray-600">Управление вашими материалами</p>
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-0 border-b border-gray-200 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <Card key={i} hover={false}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </Card>
            ))}
          </div>

          <Card hover={false}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние продажи</h2>
            <div className="space-y-3">
              {[
                { doc: 'Конспект занятия "Осенние листья"', buyer: 'Анна С.', date: '15 марта', amount: 149 },
                { doc: 'Диагностика речевого развития', buyer: 'Елена К.', date: '14 марта', amount: 180 },
                { doc: 'Конспект занятия "Осенние листья"', buyer: 'Ольга М.', date: '13 марта', amount: 149 }
              ].map((sale, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{sale.doc}</p>
                    <p className="text-xs text-gray-500">{sale.buyer} · {sale.date}</p>
                  </div>
                  <span className="font-semibold text-green-600">+{sale.amount} ₽</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          {myDocuments.map(doc => {
            const st = statusConfig[doc.status];
            return (
              <Card key={doc.id} hover={false}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-500">{doc.category}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                          {st.icon}
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm flex-shrink-0">
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{doc.sales}</p>
                      <p className="text-gray-500 text-xs">продаж</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{doc.revenue > 0 ? `${doc.revenue} ₽` : '—'}</p>
                      <p className="text-gray-500 text-xs">выручка</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{doc.views}</p>
                      <p className="text-gray-500 text-xs">просмотров</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card hover={false}>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Загрузить новый материал</h2>
              <form className="space-y-5">
                <Input
                  label="Название документа"
                  placeholder="Например: Конспект занятия по экологии"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                />
                <Select
                  label="Категория"
                  options={categoryOptions}
                  value={uploadForm.category}
                  onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                />
                <Textarea
                  label="Описание"
                  placeholder="Кратко опишите содержание материала, его цель и для кого он предназначен..."
                  value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={5}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Файл</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">Перетащите файл или нажмите для выбора</p>
                    <p className="text-xs text-gray-400">PDF, DOCX, PPT — до 20 МБ</p>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Отправить на модерацию
                </Button>
              </form>
            </Card>
          </div>

          <div>
            <Card hover={false} className="bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">Правила публикации</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  'Материалы должны соответствовать ФОП ДО',
                  'Только авторские работы',
                  'Высокое качество оформления',
                  'Проверка занимает 1-2 рабочих дня',
                  'Ставка автора: от 25% до 60%'
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
