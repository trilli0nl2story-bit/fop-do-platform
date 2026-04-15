import { useState } from 'react';
import { HelpCircle, User, CheckCircle, Clock, MessageCircle, Eye, Globe, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../components/Card';

type QuestionStatus = 'new' | 'in_progress' | 'answered' | 'closed' | 'published';

interface Question {
  id: number;
  ticketId: string;
  name: string;
  age: number;
  city: string;
  position: string;
  groupAge: string;
  program: string;
  topic: string;
  question: string;
  date: string;
  status: QuestionStatus;
  assignedAdmin: string | null;
  assignedExpert: string | null;
  answer: string;
  thanksSent: boolean;
  expanded: boolean;
}

const statusConfig: Record<QuestionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'Новый', color: 'bg-blue-50 text-blue-700', icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: 'В работе', color: 'bg-amber-50 text-amber-700', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  answered: { label: 'Ответ дан', color: 'bg-green-50 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  closed: { label: 'Закрыт', color: 'bg-gray-100 text-gray-600', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  published: { label: 'Опубликован', color: 'bg-teal-50 text-teal-700', icon: <Globe className="w-3.5 h-3.5" /> },
};

const ADMINS = ['Не назначен', 'Петрова Е.', 'Смирнова А.', 'Козлов И.'];
const EXPERTS = ['Не назначен', 'Иванова М.С.', 'Соколова Т.Р.', 'Лебедева В.В.'];

export function AdminYoungSpecialist() {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      ticketId: 'МС-2024-001',
      name: 'Анна',
      age: 24,
      city: 'Новосибирск',
      position: 'Воспитатель',
      groupAge: '4–5 лет',
      program: 'ФОП ДО',
      topic: 'Адаптация ребёнка к детскому саду',
      question: 'В мою группу вернулся ребёнок 4 лет, который не посещал детский сад почти год из-за болезни. Он плачет каждое утро, не хочет оставаться. Как правильно организовать адаптацию?',
      date: '10 марта 2024',
      status: 'answered',
      assignedAdmin: 'Козлов И.',
      assignedExpert: 'Иванова М.С.',
      answer: 'Это повторная адаптация. Важно организовать сокращённое пребывание с постепенным увеличением...',
      thanksSent: true,
      expanded: false,
    },
    {
      id: 2,
      ticketId: 'МС-2024-002',
      name: 'Марина',
      age: 26,
      city: 'Екатеринбург',
      position: 'Воспитатель',
      groupAge: '3–4 года',
      program: 'ФОП ДО',
      topic: 'Документация воспитателя по ФОП ДО',
      question: 'Какие документы обязательно должны быть у воспитателя по новым требованиям ФОП ДО? Я только начала работать.',
      date: '8 марта 2024',
      status: 'new',
      assignedAdmin: null,
      assignedExpert: null,
      answer: '',
      thanksSent: false,
      expanded: false,
    },
    {
      id: 3,
      ticketId: 'МС-2024-003',
      name: 'Ольга',
      age: 23,
      city: 'Казань',
      position: 'Воспитатель',
      groupAge: '5–6 лет',
      program: 'ФАОП ДО',
      topic: 'Работа с детьми с ТНР в общеразвивающей группе',
      question: 'В общеразвивающую группу перевели ребёнка с тяжёлым нарушением речи. Логопеда в саду нет. Что я могу сделать самостоятельно?',
      date: '5 марта 2024',
      status: 'in_progress',
      assignedAdmin: 'Петрова Е.',
      assignedExpert: 'Соколова Т.Р.',
      answer: '',
      thanksSent: false,
      expanded: false,
    },
  ]);

  const [filter, setFilter] = useState<QuestionStatus | 'all'>('all');
  const [answerTexts, setAnswerTexts] = useState<Record<number, string>>({});

  const filtered = questions.filter(q => filter === 'all' || q.status === filter);

  const update = (id: number, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const counts = {
    all: questions.length,
    new: questions.filter(q => q.status === 'new').length,
    in_progress: questions.filter(q => q.status === 'in_progress').length,
    answered: questions.filter(q => q.status === 'answered').length,
    published: questions.filter(q => q.status === 'published').length,
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <HelpCircle className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900">Молодой специалист</h1>
        </div>
        <p className="text-sm text-gray-500">Управление вопросами педагогов и публикациями в базу ответов</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {([
          { key: 'all', label: 'Всего', value: counts.all, color: 'text-gray-900', bg: 'bg-gray-50' },
          { key: 'new', label: 'Новых', value: counts.new, color: 'text-blue-700', bg: 'bg-blue-50' },
          { key: 'in_progress', label: 'В работе', value: counts.in_progress, color: 'text-amber-700', bg: 'bg-amber-50' },
          { key: 'answered', label: 'Отвечено', value: counts.answered, color: 'text-green-700', bg: 'bg-green-50' },
        ] as const).map(item => (
          <Card
            key={item.key}
            hover={false}
            className={`cursor-pointer transition-colors ${filter === item.key ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setFilter(item.key)}
          >
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-sm text-gray-600 mt-1">{item.label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(q => {
          const st = statusConfig[q.status];
          return (
            <Card key={q.id} hover={false}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-500">#{q.ticketId}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                    {st.icon}
                    {st.label}
                  </span>
                </div>
                <button
                  onClick={() => update(q.id, { expanded: !q.expanded })}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400"
                >
                  {q.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{q.name}, {q.age} лет · {q.position}</p>
                  <p className="text-xs text-gray-500">{q.city} · {q.groupAge} · {q.program} · {q.date}</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-teal-700 mb-1">{q.topic}</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{q.question}</p>

              {q.expanded && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Назначить администратора</label>
                      <select
                        value={q.assignedAdmin ?? 'Не назначен'}
                        onChange={e => update(q.id, { assignedAdmin: e.target.value === 'Не назначен' ? null : e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        {ADMINS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Назначить эксперта</label>
                      <select
                        value={q.assignedExpert ?? 'Не назначен'}
                        onChange={e => update(q.id, { assignedExpert: e.target.value === 'Не назначен' ? null : e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        {EXPERTS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Статус</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(statusConfig) as QuestionStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={() => update(q.id, { status: s })}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                            q.status === s
                              ? statusConfig[s].color + ' ring-2 ring-offset-1 ring-current'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {statusConfig[s].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ответ эксперта</label>
                    {q.answer ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700 leading-relaxed">{q.answer}</p>
                      </div>
                    ) : (
                      <div>
                        <textarea
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                          rows={4}
                          placeholder="Введите ответ для пользователя..."
                          value={answerTexts[q.id] ?? ''}
                          onChange={e => setAnswerTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                        />
                        <button
                          onClick={() => {
                            if (answerTexts[q.id]?.trim()) {
                              update(q.id, { answer: answerTexts[q.id], status: 'answered' });
                            }
                          }}
                          className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Отправить ответ
                        </button>
                      </div>
                    )}
                  </div>

                  {q.thanksSent && q.status === 'answered' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-3">
                        Пользователь нажал «Спасибо». Опубликовать в базе ответов?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => update(q.id, { status: 'published' })}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Опубликовать в базе ответов
                        </button>
                        <button
                          onClick={() => update(q.id, { status: 'closed' })}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                          Оставить только в личном обращении
                        </button>
                      </div>
                    </div>
                  )}

                  {q.status === 'published' && (
                    <div className="flex items-center gap-2 text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">Опубликовано в базе ответов молодому специалисту</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
