import { useState } from 'react';
import { HelpCircle, Send, X, Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { ConsentCheckbox } from '../components/ConsentCheckbox';

interface YoungSpecialistProps {
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
  hasSubscription?: boolean;
}

const EXAMPLE_QA = [
  {
    question: 'Как составить адаптационный маршрут для нового ребёнка?',
    answer: 'Адаптационный маршрут составляется на основе наблюдений за ребёнком в первые дни посещения детского сада. Он включает расписание постепенного пребывания, индивидуальные особенности питания и сна, рекомендации для родителей по домашней подготовке. Маршрут согласовывается с педагогом-психологом и родителями. Важно фиксировать реакции ребёнка и корректировать план по необходимости. Длительность адаптационного периода в среднем составляет 2–4 недели, но может быть продлена в зависимости от индивидуальных особенностей...',
    full: 'В полном ответе описаны этапы составления маршрута, примерная форма документа и советы по работе с родителями.',
  },
  {
    question: 'Как правильно оформить КТП по ФОП ДО?',
    answer: 'Календарно-тематическое планирование по ФОП ДО оформляется с учётом образовательных областей программы. Структура включает тему недели, цели и задачи по каждой образовательной области, виды деятельности, планируемые результаты и формы работы с детьми. КТП составляется на учебный год и разбивается на месяцы и недели. В шапке указывают группу, программу, педагога и дату...',
    full: 'Полный ответ включает образец оформления КТП, перечень обязательных разделов и типичные ошибки.',
  },
  {
    question: 'Что должна включать рабочая программа воспитателя?',
    answer: 'Рабочая программа воспитателя разрабатывается на основе образовательной программы ДОО с учётом ФОП ДО. Обязательные разделы: целевой (цели, задачи, принципы, планируемые результаты), содержательный (содержание работы по образовательным областям) и организационный (режим дня, особенности планирования, работа с родителями). Программа утверждается заведующим ДОО...',
    full: 'В полном ответе — шаблон программы, требования к оформлению и список нормативных документов.',
  },
];

export function YoungSpecialist({ onNavigate, isAuthenticated = false }: YoungSpecialistProps) {
  const [form, setForm] = useState({ name: '', position: '', topic: '', question: '' });
  const [consent, setConsent] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    if (!isAuthenticated) {
      setShowGate(true);
      return;
    }
    onNavigate('question-ticket');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowGate(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-5">
              <HelpCircle className="w-6 h-6 text-teal-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Регистрация для отправки вопроса</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Зарегистрируйтесь бесплатно, чтобы отправить вопрос и получить ответ эксперта.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={() => onNavigate('register')} className="w-full justify-center">
                Зарегистрироваться бесплатно
              </Button>
              <button
                onClick={() => setShowGate(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
              >
                Вернуться к форме
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Помощь молодому специалисту</h1>
          </div>
          <p className="text-gray-600 text-base leading-relaxed">
            Столкнулись с задачей, на которую не знаете ответа?<br />
            Опишите ситуацию — эксперт поможет.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-10 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Задайте вопрос</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя *</label>
                <Input
                  placeholder="Ваше имя"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Должность *</label>
                <Input
                  placeholder="Например: Воспитатель"
                  value={form.position}
                  onChange={e => handleChange('position', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Тема вопроса *</label>
              <Input
                placeholder="Кратко опишите тему"
                value={form.topic}
                onChange={e => handleChange('topic', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ваш вопрос *</label>
              <Textarea
                placeholder="Опишите ситуацию подробно. Чем больше деталей — тем точнее будет ответ..."
                value={form.question}
                onChange={e => handleChange('question', e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="pt-1">
              <ConsentCheckbox checked={consent} onChange={setConsent} onNavigate={onNavigate} />
            </div>

            <Button type="submit" size="lg" className="w-full justify-center" disabled={!consent}>
              <Send className="w-5 h-5" />
              Отправить вопрос
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Примеры вопросов и ответов</h2>
          <p className="text-sm text-gray-500 mb-6">Посмотрите, как работает экспертная помощь</p>

          <div className="space-y-4">
            {EXAMPLE_QA.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{item.question}</p>
                </div>
                <div className="px-6 pt-4 pb-0">
                  <div className="relative">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  </div>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-400">{item.full}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('register')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Зарегистрируйтесь бесплатно, чтобы прочитать полный ответ →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
