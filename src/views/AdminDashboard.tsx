import { useState } from 'react';
import {
  LayoutDashboard, DollarSign, Users, FileText, Crown, Share2,
  Bot, TrendingUp, AlertCircle, CheckCircle, Clock, ChevronUp,
  UserCheck, Eye, ThumbsUp, ThumbsDown, RotateCcw, FolderOpen, Package, HelpCircle, Trash2
} from 'lucide-react';
import { Card } from '../components/Card';
import { AdminRevenue } from './admin/AdminRevenue';
import { AdminAuthors } from './admin/AdminAuthors';
import { AdminDocuments } from './admin/AdminDocuments';
import { AdminSubscriptions } from './admin/AdminSubscriptions';
import { AdminReferrals } from './admin/AdminReferrals';
import { AdminAI } from './admin/AdminAI';
import { AdminUsers } from './admin/AdminUsers';
import { AdminCategories } from './admin/AdminCategories';
import { AdminOrders } from './admin/AdminOrders';
import { AdminYoungSpecialist } from './admin/AdminYoungSpecialist';

type AdminSection = 'dashboard' | 'revenue' | 'authors' | 'applications' | 'documents' | 'subscriptions' | 'referrals' | 'ai' | 'users' | 'categories' | 'orders' | 'young-specialist';

const navItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Обзор', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'revenue', label: 'Выручка', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'orders', label: 'Заказы', icon: <Package className="w-5 h-5" /> },
  { id: 'authors', label: 'Авторы', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'applications', label: 'Заявки авторов', icon: <UserCheck className="w-5 h-5" /> },
  { id: 'documents', label: 'Документы', icon: <FileText className="w-5 h-5" /> },
  { id: 'categories', label: 'Категории', icon: <FolderOpen className="w-5 h-5" /> },
  { id: 'subscriptions', label: 'Подписки', icon: <Crown className="w-5 h-5" /> },
  { id: 'referrals', label: 'Рефералы', icon: <Share2 className="w-5 h-5" /> },
  { id: 'ai', label: 'AI-запросы', icon: <Bot className="w-5 h-5" /> },
  { id: 'users', label: 'Пользователи', icon: <Users className="w-5 h-5" /> },
  { id: 'young-specialist', label: 'Мол. специалист', icon: <HelpCircle className="w-5 h-5" /> }
];

function StatCard({ label, value, change, icon, bg, color }: {
  label: string; value: string; change?: string; icon: React.ReactNode; bg: string; color: string;
}) {
  return (
    <Card hover={false}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {change && (
          <div className="flex items-center gap-0.5 text-green-600 text-xs font-semibold">
            <ChevronUp className="w-3 h-3" />
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </Card>
  );
}

const MiniBar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
  </div>
);

const QA_STORAGE_KEYS = ['cms_products', 'cms_categories'];

function QaCleanupCard() {
  const [cleaned, setCleaned] = useState(false);

  const handleCleanup = () => {
    QA_STORAGE_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const items = JSON.parse(raw) as Array<{ title?: string; name?: string; id?: string }>;
        const filtered = items.filter(item => {
          const text = ((item.title || '') + (item.name || '')).toLowerCase();
          return !text.includes('qa') && !text.includes('тест') && !text.includes('test');
        });
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch {
        // ignore
      }
    });
    setCleaned(true);
    window.setTimeout(() => setCleaned(false), 3000);
  };

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <Trash2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900 text-sm mb-1">Очистка QA/тестовых данных</p>
          <p className="text-xs text-amber-700 mb-3">
            Удаляет из localStorage записи с «QA», «тест», «test» в названии. Производственные данные не затрагиваются.
          </p>
          <button
            onClick={handleCleanup}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              cleaned
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-200 hover:bg-amber-300 text-amber-900'
            }`}
          >
            {cleaned ? 'Очищено' : 'Очистить тестовые данные'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ isAdmin = false, isQaMode = false }: { isAdmin?: boolean; isQaMode?: boolean }) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Доступ запрещён</h1>
          <p className="text-gray-500 text-sm mb-6">
            У вас нет прав для просмотра этой страницы. Войдите с учётной записью администратора.
          </p>
          <p className="text-xs text-gray-400 bg-gray-100 rounded-lg px-3 py-2">
            В dev-режиме доступ открывается кнопкой «dev: admin» в правом нижнем углу.
          </p>
        </div>
      </div>
    );
  }

  const dashboardMetrics = [
    { label: 'Выручка сегодня', value: '14 280 ₽', change: '12%', icon: <DollarSign className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-600' },
    { label: 'Выручка за 30 дней', value: '284 600 ₽', change: '8%', icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Заказов', value: '48', change: '5%', icon: <FileText className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-600' },
    { label: 'Документов продано', value: '312', change: '14%', icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Новых пользователей', value: '37', change: '21%', icon: <Users className="w-5 h-5" />, bg: 'bg-sky-50', color: 'text-sky-600' },
    { label: 'Активных подписок', value: '184', change: '3%', icon: <Crown className="w-5 h-5" />, bg: 'bg-amber-50', color: 'text-amber-500' },
    { label: 'AI-запросов', value: '1 240', change: '30%', icon: <Bot className="w-5 h-5" />, bg: 'bg-green-50', color: 'text-green-500' },
    { label: 'На модерации', value: '6', icon: <Clock className="w-5 h-5" />, bg: 'bg-orange-50', color: 'text-orange-500' }
  ];

  const recentUsers = [
    { name: 'Иванова Мария', role: 'Воспитатель', date: '15 марта', plan: 'Премиум' },
    { name: 'Козлова Анна', role: 'Методист', date: '15 марта', plan: 'Базовый' },
    { name: 'Смирнова Елена', role: 'Специалист', date: '14 марта', plan: 'Премиум' },
    { name: 'Петрова Ольга', role: 'Заведующая', date: '14 марта', plan: 'Базовый' },
    { name: 'Сидорова Наталья', role: 'Воспитатель', date: '13 марта', plan: 'Базовый' }
  ];

  const pendingDocuments = [
    { title: 'Рабочая программа (Средняя группа)', author: 'Петрова О.', submitted: '14 марта', type: 'DOCX' },
    { title: 'Картотека подвижных игр', author: 'Сидорова Н.', submitted: '13 марта', type: 'PDF' },
    { title: 'Сценарий "День защитника"', author: 'Козлова А.', submitted: '12 марта', type: 'PPT' }
  ];

  type AppStatus = 'pending' | 'approved' | 'rejected' | 'revision';

  const [authorApplications, setAuthorApplications] = useState<{
    id: number;
    name: string;
    email: string;
    experience: string;
    position: string;
    city: string;
    employment: string;
    date: string;
    status: AppStatus;
    docName: string;
    bio: string;
    expanded: boolean;
  }[]>([
    { id: 1, name: 'Иванова Мария Сергеевна', email: 'ivanova@mail.ru', experience: '12 лет в ДОУ', position: 'Воспитатель высшей категории', city: 'Москва', employment: 'Самозанятый', date: '15 марта 2024', status: 'pending', docName: 'konspekt_ekologiya.pdf', bio: 'Занимаюсь разработкой конспектов занятий и рабочих программ по ФГОС ДО.', expanded: false },
    { id: 2, name: 'Козлова Анна Петровна', email: 'kozlova@yandex.ru', experience: '7 лет, методист', position: 'Старший воспитатель', city: 'Санкт-Петербург', employment: 'ИП', date: '14 марта 2024', status: 'pending', docName: 'diagnostika_rechevogo.docx', bio: 'Специализируюсь на диагностических материалах и методических пособиях.', expanded: false },
    { id: 3, name: 'Смирнова Елена Владимировна', email: 'smirnova@gmail.com', experience: '5 лет', position: 'Воспитатель', city: 'Екатеринбург', employment: 'Самозанятый', date: '12 марта 2024', status: 'revision', docName: 'plan_vesna.pdf', bio: 'Создаю тематические планы занятий и сценарии праздников.', expanded: false },
  ]);

  const updateApplicationStatus = (id: number, status: AppStatus) => {
    setAuthorApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const toggleExpanded = (id: number) => {
    setAuthorApplications(prev => prev.map(a => a.id === id ? { ...a, expanded: !a.expanded } : a));
  };

  const appStatusConfig: Record<AppStatus, { label: string; color: string }> = {
    pending: { label: 'На рассмотрении', color: 'bg-amber-50 text-amber-600' },
    approved: { label: 'Одобрена', color: 'bg-green-50 text-green-600' },
    rejected: { label: 'Отклонена', color: 'bg-red-50 text-red-600' },
    revision: { label: 'На доработку', color: 'bg-orange-50 text-orange-600' },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isQaMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-xs font-bold text-center py-1.5 tracking-wide">
          QA ADMIN MODE — prototype only
        </div>
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex-shrink-0 transition-transform duration-200 ${
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-56 ${isQaMode ? 'top-7' : ''}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">А</div>
            <span className="font-semibold text-gray-900 text-sm">Администратор</span>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setMobileNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setMobileNavOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <LayoutDashboard className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">
            {navItems.find(n => n.id === activeSection)?.label}
          </span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeSection === 'dashboard' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Обзор платформы</h1>
                <p className="text-gray-600 text-sm">Данные за 15 марта 2024</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {dashboardMetrics.map((m, i) => (
                  <StatCard key={i} {...m} />
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <Card hover={false}>
                  <h2 className="font-semibold text-gray-900 mb-4">Популярные категории</h2>
                  <div className="space-y-3">
                    {[
                      { name: 'Планы занятий', pct: 78, count: 45 },
                      { name: 'Программы', pct: 62, count: 34 },
                      { name: 'Методички', pct: 45, count: 28 },
                      { name: 'Диагностика', pct: 33, count: 19 },
                      { name: 'Сценарии', pct: 25, count: 14 }
                    ].map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">{cat.name}</span>
                          <span className="text-gray-500">{cat.count} продаж</span>
                        </div>
                        <MiniBar pct={cat.pct} color="bg-blue-400" />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card hover={false}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">На модерации</h2>
                    <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">
                      {pendingDocuments.length} ожидают
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pendingDocuments.map((doc, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-gray-500">{doc.author} · {doc.submitted}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                            ОК
                          </button>
                          <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                            Откл
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {isQaMode && <QaCleanupCard />}

              <Card hover={false}>
                <h2 className="font-semibold text-gray-900 mb-4">Последние регистрации</h2>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-xs font-semibold text-gray-500 pb-3">Пользователь</th>
                        <th className="text-left text-xs font-semibold text-gray-500 pb-3">Роль</th>
                        <th className="text-left text-xs font-semibold text-gray-500 pb-3 hidden sm:table-cell">Дата</th>
                        <th className="text-left text-xs font-semibold text-gray-500 pb-3">Тариф</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentUsers.map((u, i) => (
                        <tr key={i}>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">
                                {u.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-sm text-gray-600">{u.role}</td>
                          <td className="py-3 text-sm text-gray-500 hidden sm:table-cell">{u.date}</td>
                          <td className="py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              u.plan === 'Премиум' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {u.plan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {activeSection === 'applications' && (
            <>
              <div className="mb-6">
                <div className="mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Заявки авторов</h1>
                  <p className="text-gray-600 text-sm">
                    {authorApplications.filter(a => a.status === 'pending').length} новых заявок
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(['pending', 'approved', 'rejected', 'revision'] as AppStatus[]).map(s => (
                    <span key={s} className={`px-2 py-1 rounded-full font-medium whitespace-nowrap ${appStatusConfig[s].color}`}>
                      {appStatusConfig[s].label}: {authorApplications.filter(a => a.status === s).length}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {authorApplications.map(app => (
                  <Card key={app.id} hover={false}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {app.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{app.name}</h3>
                            <p className="text-sm text-gray-500">{app.position} · {app.city}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${appStatusConfig[app.status].color}`}>
                              {appStatusConfig[app.status].label}
                            </span>
                            <span className="text-xs text-gray-400">{app.date}</span>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500 text-xs">Email</span>
                            <p className="text-gray-800 truncate">{app.email}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Опыт</span>
                            <p className="text-gray-800">{app.experience}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Статус</span>
                            <p className="text-gray-800">{app.employment}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 truncate max-w-[160px]">{app.docName}</span>
                            <button className="text-blue-500 hover:text-blue-600 ml-1">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => toggleExpanded(app.id)}
                            className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            {app.expanded ? 'Скрыть описание' : 'Показать описание'}
                          </button>
                        </div>

                        {app.expanded && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                            {app.bio}
                          </div>
                        )}

                        {app.status === 'pending' || app.status === 'revision' ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'approved')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              Одобрить
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              Отклонить
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'revision')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-400 hover:bg-orange-500 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              На доработку
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'pending')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Сбросить решение
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {authorApplications.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Нет заявок</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'revenue' && <AdminRevenue />}
          {activeSection === 'authors' && <AdminAuthors />}
          {activeSection === 'documents' && <AdminDocuments />}
          {activeSection === 'subscriptions' && <AdminSubscriptions />}
          {activeSection === 'referrals' && <AdminReferrals />}
          {activeSection === 'ai' && <AdminAI />}
          {activeSection === 'users' && <AdminUsers />}
          {activeSection === 'categories' && <AdminCategories />}
          {activeSection === 'orders' && <AdminOrders />}
          {activeSection === 'young-specialist' && <AdminYoungSpecialist />}
        </div>
      </div>
    </div>
  );
}
