import { useState } from 'react';
import { Send, Sparkles, Crown, Lock, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

interface AskModeProps {
  hasSubscription: boolean;
  onNavigate: (page: string) => void;
}

const AGE_GROUPS = [
  '1–2 года', '2–3 года', '3–4 года', '4–5 лет', '5–6 лет', '6–7 лет',
  '1–3 года', '1–4 года', '2–4 года', '2–5 лет', '3–5 лет', '5–7 лет', '3–7 лет', '1–7 лет',
];
const PROGRAMS = ['ФОП ДО', 'ФАОП ДО'];
const DEV_FEATURES = ['Без особенностей', 'ТНР', 'ЗПР', 'РАС', 'ОНР'];

const EXAMPLE_CHIPS = [
  'Нужен конспект занятия',
  'Подобрать материалы по ФОП ДО',
  'Помочь с документом для проверки',
  'Нужна идея для работы с родителями',
];

const QUICK_ACTIONS = ['Нужно занятие', 'Нужен документ', 'Для средней группы', 'Для проверки', 'Планирование', 'Диагностика'];

const HOW_IT_WORKS = [
  'Напишите, что нужно подготовить',
  'Помощник уточнит детали',
  'Вы получите подсказку, подборку или черновик',
];

const PROTOTYPE_RESPONSE = 'Запрос принят. В рабочей версии помощник подготовит ответ или черновик документа. Сейчас раздел работает в тестовом режиме — ответ будет доступен после запуска.';

const chipClass = (selected: boolean) =>
  `px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${
    selected
      ? 'bg-blue-500 text-white border-blue-500'
      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600'
  }`;

export function AskMode({ hasSubscription, onNavigate }: AskModeProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedDevFeature, setSelectedDevFeature] = useState('');
  const [showGate, setShowGate] = useState(false);

  const buildPromptContext = () => {
    const parts: string[] = [];
    if (selectedAge) parts.push(`Возраст: ${selectedAge}`);
    if (selectedProgram) parts.push(`Программа: ${selectedProgram}`);
    if (selectedDevFeature && selectedDevFeature !== 'Без особенностей') parts.push(`Особенности: ${selectedDevFeature}`);
    return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  };

  const handleSend = () => {
    if (!input.trim()) return;
    if (!hasSubscription) {
      setShowGate(true);
      return;
    }
    const context = buildPromptContext();
    setMessages([
      ...messages,
      { role: 'user', content: input + context },
      { role: 'assistant', content: PROTOTYPE_RESPONSE },
    ]);
    setInput('');
  };

  const handleChip = (chip: string) => {
    setInput(chip);
  };

  const handleQuickAction = (action: string) => {
    setInput(input + (input ? ' ' : '') + action);
  };

  return (
    <div className="flex flex-col h-full relative">
      {showGate && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <button
                onClick={() => setShowGate(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Помощник доступен по подписке</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              В подписку входит 15 запросов к помощнику в месяц, библиотека материалов и скидка 25% на магазин.
            </p>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 mb-3"
              onClick={() => onNavigate('subscription')}
            >
              <Crown className="w-4 h-4" />
              Оформить подписку за 278 ₽/мес
            </Button>
            <button
              onClick={() => setShowGate(false)}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Вернуться к помощнику
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-5">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Помощник методического кабинета</h2>
                <p className="text-sm text-gray-500">Помощник помогает сформулировать запрос, подобрать материал и подготовить черновик документа.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Как это работает</p>
                <ol className="space-y-2">
                  {HOW_IT_WORKS.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {!hasSubscription && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Отправка запросов доступна по подписке.{' '}
                    <button
                      onClick={() => onNavigate('subscription')}
                      className="underline font-medium hover:text-amber-900 transition-colors"
                    >
                      Оформить за 278 ₽/мес
                    </button>
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Примеры запросов</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleChip(chip)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl px-5 py-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-500">Помощник · тестовый режим</span>
                    </div>
                  )}
                  <p className="leading-relaxed text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card hover={false} className="bg-white">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Возраст</p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {AGE_GROUPS.map((age) => (
                  <button key={age} onClick={() => setSelectedAge(selectedAge === age ? '' : age)} className={chipClass(selectedAge === age)}>{age}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Программа</p>
              <div className="flex flex-wrap gap-1.5">
                {PROGRAMS.map((prog) => (
                  <button key={prog} onClick={() => setSelectedProgram(selectedProgram === prog ? '' : prog)} className={chipClass(selectedProgram === prog)}>{prog}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Особенности развития</p>
              <div className="flex flex-wrap gap-1.5">
                {DEV_FEATURES.map((feat) => (
                  <button key={feat} onClick={() => setSelectedDevFeature(selectedDevFeature === feat ? '' : feat)} className={chipClass(selectedDevFeature === feat)}>{feat}</button>
                ))}
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.slice(0, 4).map((action, i) => (
                <button key={i} onClick={() => handleQuickAction(action)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-colors">
                  {action}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Опишите, что вам нужно..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm"
            />
            <Button onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
