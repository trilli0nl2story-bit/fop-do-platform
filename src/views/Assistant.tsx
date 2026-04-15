import { useState } from 'react';
import { MessageSquare, FileText, LayoutTemplate, Sparkles } from 'lucide-react';
import { AskMode } from './assistant/AskMode';
import { CreateMode } from './assistant/CreateMode';
import { TemplateMode } from './assistant/TemplateMode';

type Mode = 'ask' | 'create' | 'template';

interface AssistantProps {
  isAuthenticated: boolean;
  hasSubscription: boolean;
  onNavigate: (page: string) => void;
}

const modes: { id: Mode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'ask', label: 'Спросить', icon: <MessageSquare className="w-4 h-4" />, description: 'Задайте вопрос помощнику' },
  { id: 'create', label: 'Создать документ', icon: <FileText className="w-4 h-4" />, description: 'Генерация по параметрам' },
  { id: 'template', label: 'Собрать по шаблону', icon: <LayoutTemplate className="w-4 h-4" />, description: 'Готовые шаблоны документов' },
];

export function Assistant({ hasSubscription, onNavigate }: AssistantProps) {
  const [activeMode, setActiveMode] = useState<Mode>('ask');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">Помощник методического кабинета</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">тестовый режим</span>
            </div>
            <p className="text-sm text-gray-600">Выберите режим работы</p>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 leading-relaxed">
          Помощник помогает сформулировать запрос, подобрать материал и подготовить черновик документа. Сейчас раздел работает в тестовом режиме.
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeMode === mode.id
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeMode === 'ask' && <AskMode hasSubscription={hasSubscription} onNavigate={onNavigate} />}
        {activeMode === 'create' && <CreateMode hasSubscription={hasSubscription} onNavigate={onNavigate} />}
        {activeMode === 'template' && <TemplateMode hasSubscription={hasSubscription} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
