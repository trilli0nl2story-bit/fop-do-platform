import { useState } from 'react';
import { FileText, Download, X, ArrowLeft, BookOpen, File, Presentation } from 'lucide-react';
import { Button } from '../components/Button';

interface FreeMaterialsPreviewProps {
  onNavigate: (page: string) => void;
}

interface PreviewMaterial {
  id: number;
  title: string;
  fileType: 'PDF' | 'DOCX' | 'PPT';
  ageGroup: string;
  category: string;
}

const PREVIEW_MATERIALS: PreviewMaterial[] = [
  {
    id: 1,
    title: 'Конспект занятия «Знакомство с цветами» — младшая группа',
    fileType: 'PDF',
    ageGroup: 'Младшая группа (3–4 года)',
    category: 'Конспекты занятий',
  },
  {
    id: 2,
    title: 'Диагностическая карта речевого развития — средняя группа',
    fileType: 'DOCX',
    ageGroup: 'Средняя группа (4–5 лет)',
    category: 'Диагностика',
  },
  {
    id: 3,
    title: 'КТП на неделю по образовательной области «Познание»',
    fileType: 'DOCX',
    ageGroup: 'Старшая группа (5–6 лет)',
    category: 'КТП',
  },
  {
    id: 4,
    title: 'Материалы для родительского собрания «Адаптация ребёнка к детскому саду»',
    fileType: 'PPT',
    ageGroup: 'Ясельная группа (1,5–3 года)',
    category: 'Работа с родителями',
  },
  {
    id: 5,
    title: 'Конспект занятия по ФЭМП «Счёт до пяти»',
    fileType: 'PDF',
    ageGroup: 'Средняя группа (4–5 лет)',
    category: 'Конспекты занятий',
  },
  {
    id: 6,
    title: 'Диагностика уровня физического развития — подготовительная группа',
    fileType: 'DOCX',
    ageGroup: 'Подготовительная группа (6–7 лет)',
    category: 'Диагностика',
  },
  {
    id: 7,
    title: 'Сценарий праздника «Осенний утренник»',
    fileType: 'DOCX',
    ageGroup: 'Старшая группа (5–6 лет)',
    category: 'Сценарии',
  },
  {
    id: 8,
    title: 'Листовка для родителей «Режим дня дошкольника»',
    fileType: 'PDF',
    ageGroup: 'Все группы',
    category: 'Работа с родителями',
  },
];

const FILE_TYPE_STYLES: Record<PreviewMaterial['fileType'], { bg: string; text: string; icon: JSX.Element }> = {
  PDF: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: <FileText className="w-4 h-4" />,
  },
  DOCX: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: <File className="w-4 h-4" />,
  },
  PPT: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: <Presentation className="w-4 h-4" />,
  },
};

export function FreeMaterialsPreview({ onNavigate }: FreeMaterialsPreviewProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  const handleMaterialClick = () => {
    setShowPrompt(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowPrompt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Материал доступен после регистрации</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Зарегистрируйтесь бесплатно, чтобы открыть материалы и сохранить их в кабинет.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={() => onNavigate('register')} className="w-full justify-center">
                Зарегистрироваться бесплатно
              </Button>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700 mb-4">
            Бесплатные материалы
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Примеры бесплатных материалов
          </h1>
          <p className="text-gray-500 text-base max-w-xl">
            Эти материалы доступны бесплатно после регистрации. Посмотрите, что вас ждёт на платформе.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-12">
          {PREVIEW_MATERIALS.map((material) => {
            const typeStyle = FILE_TYPE_STYLES[material.fileType];
            return (
              <div
                key={material.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${typeStyle.bg} rounded-lg flex items-center justify-center flex-shrink-0 ${typeStyle.text}`}>
                    {typeStyle.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {material.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md ${typeStyle.bg} ${typeStyle.text}`}>
                        {material.fileType}
                      </span>
                      <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-md">
                        {material.ageGroup}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{material.category}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-green-600 font-medium">Бесплатно</span>
                  <button
                    onClick={handleMaterialClick}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Открыть
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 sm:p-10 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Хотите получить доступ ко всем материалам?</h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto text-sm">
            После регистрации вы получите доступ к бесплатным материалам и сможете изучить платформу без ограничений.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('register')}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-8 py-4 text-lg bg-white text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow-md"
            >
              Зарегистрироваться бесплатно
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-8 py-4 text-lg bg-transparent text-white border border-white/50 hover:bg-white/10"
            >
              Войти в кабинет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
