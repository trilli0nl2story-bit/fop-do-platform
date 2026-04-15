import { useState } from 'react';
import { FileText, BookOpen, ClipboardList, Calendar, BarChart3, UserCheck, ArrowLeft, Save, Download, Wand2, PenLine, Sparkles, RotateCcw, Crown, Lock, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Textarea } from '../../components/Textarea';

const templates = [
  { id: 'lesson', title: 'Конспект занятия', icon: <FileText className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
  { id: 'consultation', title: 'Консультация для родителей', icon: <BookOpen className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
  { id: 'diagnostic', title: 'Диагностическая карта', icon: <ClipboardList className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' },
  { id: 'scenario', title: 'Сценарий мероприятия', icon: <Calendar className="w-6 h-6" />, color: 'bg-teal-50 text-teal-600' },
  { id: 'plan', title: 'План работы', icon: <BarChart3 className="w-6 h-6" />, color: 'bg-sky-50 text-sky-600' },
  { id: 'characteristic', title: 'Характеристика', icon: <UserCheck className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600' },
];

const AGE_OPTIONS = [
  { value: '', label: 'Выберите возраст' },
  { value: '1-2', label: '1–2 года' }, { value: '2-3', label: '2–3 года' },
  { value: '3-4', label: '3–4 года' }, { value: '4-5', label: '4–5 лет' },
  { value: '5-6', label: '5–6 лет' }, { value: '6-7', label: '6–7 лет' },
  { value: '1-3', label: '1–3 года' }, { value: '3-5', label: '3–5 лет' },
  { value: '5-7', label: '5–7 лет' }, { value: '3-7', label: '3–7 лет' },
];

const PROGRAM_OPTIONS = [
  { value: '', label: 'Выберите программу' },
  { value: 'fop-do', label: 'ФОП ДО' },
  { value: 'faop-do', label: 'ФАОП ДО' },
];

const DEV_OPTIONS = [
  { value: '', label: 'Без особенностей' },
  { value: 'tnr', label: 'ТНР' }, { value: 'zpr', label: 'ЗПР' },
  { value: 'ras', label: 'РАС' }, { value: 'onr', label: 'ОНР' },
];

const FORMAT_OPTIONS = [
  { value: '', label: 'Выберите формат' },
  { value: 'docx', label: 'DOCX' },
  { value: 'pdf', label: 'PDF' },
];

interface TemplateModeProps {
  hasSubscription: boolean;
  onNavigate: (page: string) => void;
}

export function TemplateMode({ hasSubscription, onNavigate }: TemplateModeProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [form, setForm] = useState({
    topic: '', age: '', program: '', devFeature: '',
    goal: '', tasks: '', format: '',
  });
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleGenerate = () => {
    if (!hasSubscription) {
      setShowGate(true);
      return;
    }
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1200);
  };

  const handleClear = () => {
    setForm({ topic: '', age: '', program: '', devFeature: '', goal: '', tasks: '', format: '' });
    setGenerated(false);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setGenerated(false);
    handleClear();
  };

  const canGenerate = form.topic.trim() && form.age;
  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  if (!selectedTemplate) {
    return (
      <div className="overflow-y-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Выберите шаблон</h2>
          <p className="text-gray-600 text-sm">Заполните параметры, и помощник соберёт документ по структуре</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 text-left hover:border-blue-400 hover:shadow-lg transition-all group"
            >
              <div className={`w-12 h-12 ${t.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {t.icon}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {t.title}
              </h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto relative">
      {showGate && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <button onClick={() => setShowGate(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Помощник доступен по подписке</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              В подписку входит 15 запросов к помощнику в месяц, библиотека материалов и скидка 25% на магазин.
            </p>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 mb-3" onClick={() => onNavigate('subscription')}>
              <Crown className="w-4 h-4" />
              Оформить подписку за 278 ₽/мес
            </Button>
            <button onClick={() => setShowGate(false)} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Вернуться к помощнику
            </button>
          </div>
        </div>
      )}
      <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Назад к шаблонам
      </button>

      <div className="flex items-center gap-3 mb-6">
        {currentTemplate && (
          <div className={`w-10 h-10 ${currentTemplate.color} rounded-lg flex items-center justify-center`}>
            {currentTemplate.icon}
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900">{currentTemplate?.title}</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card hover={false}>
          <h3 className="font-semibold text-gray-900 mb-4">Параметры шаблона</h3>
          <div className="space-y-4">
            <Input label="Тема" placeholder="Укажите тему" value={form.topic} onChange={update('topic')} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Возраст" options={AGE_OPTIONS} value={form.age} onChange={update('age')} required />
              <Select label="Программа" options={PROGRAM_OPTIONS} value={form.program} onChange={update('program')} />
            </div>
            <Select label="Особенности развития" options={DEV_OPTIONS} value={form.devFeature} onChange={update('devFeature')} />
            <Input label="Цель" placeholder="Основная цель" value={form.goal} onChange={update('goal')} />
            <Textarea label="Задачи" placeholder="Перечислите задачи" value={form.tasks} onChange={update('tasks')} rows={3} />
            <Select label="Формат" options={FORMAT_OPTIONS} value={form.format} onChange={update('format')} />
            <div className="flex gap-3 pt-2">
              <Button onClick={handleGenerate} disabled={!canGenerate || generating} className="flex-1">
                <Sparkles className="w-4 h-4" />
                {generating ? 'Создаётся...' : 'Собрать'}
              </Button>
              <Button variant="secondary" onClick={handleClear}>
                <RotateCcw className="w-4 h-4" />
                Очистить
              </Button>
            </div>
          </div>
        </Card>

        <div>
          {!generated ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-16">
                <div className={`w-16 h-16 ${currentTemplate?.color || 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50`}>
                  {currentTemplate?.icon || <FileText className="w-8 h-8" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Документ появится здесь</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Заполните параметры шаблона и нажмите "Собрать"
                </p>
              </div>
            </div>
          ) : (
            <Card hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold text-gray-900">{currentTemplate?.title}</h3>
                </div>
                <span className="text-xs text-gray-400">Подготовлено помощником</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 min-h-[300px] mb-6">
                <h4 className="text-base font-bold text-gray-900 mb-3">{form.topic}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Тип:</strong> {currentTemplate?.title}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Возраст:</strong> {AGE_OPTIONS.find(a => a.value === form.age)?.label}
                </p>
                {form.program && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Программа:</strong> {PROGRAM_OPTIONS.find(p => p.value === form.program)?.label}
                  </p>
                )}
                {form.goal && (
                  <p className="text-sm text-gray-600 mb-2"><strong>Цель:</strong> {form.goal}</p>
                )}
                <div className="mt-4 space-y-2 text-sm text-gray-700 leading-relaxed">
                  <p>Документ сформирован по шаблону "{currentTemplate?.title}" с учётом указанных параметров.</p>
                  <p>Структура и содержание соответствуют требованиям ФОП ДО для выбранной возрастной группы.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button size="sm" variant="secondary"><Save className="w-4 h-4" />Сохранить</Button>
                <Button size="sm" variant="secondary"><Download className="w-4 h-4" />Скачать</Button>
                <Button size="sm" variant="secondary"><Wand2 className="w-4 h-4" />Улучшить</Button>
                <Button size="sm" variant="secondary"><PenLine className="w-4 h-4" />Доработать</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
