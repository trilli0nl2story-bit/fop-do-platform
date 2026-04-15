import { useState } from 'react';
import {
  ArrowLeft, BookOpen, X, FileText, File, Presentation,
  Download, Bookmark, ShoppingCart, Lock, Star
} from 'lucide-react';
import { Button } from '../components/Button';

interface CabinetPreviewProps {
  onNavigate: (page: string) => void;
}

type SectionKey = 'free' | 'subscription' | 'store';

interface DemoMaterial {
  id: number;
  title: string;
  category: string;
  ageGroup: string;
  fileType: 'PDF' | 'DOCX' | 'PPT';
  program: string;
  section: SectionKey;
  price?: number;
}

const DEMO_MATERIALS: DemoMaterial[] = [
  { id: 1, title: 'Памятка для воспитателя по ФОП ДО', category: 'Методички', ageGroup: '3–7 лет', fileType: 'PDF', program: 'ФОП ДО', section: 'free' },
  { id: 2, title: 'Шаблон родительского уголка', category: 'Шаблоны', ageGroup: '3–7 лет', fileType: 'DOCX', program: 'Универсальный', section: 'free' },
  { id: 3, title: 'Режим дня: образец для разных групп', category: 'Документация', ageGroup: '1–7 лет', fileType: 'PDF', program: 'Универсальный', section: 'free' },
  { id: 4, title: 'Глоссарий терминов ФОП ДО', category: 'Справочники', ageGroup: '3–7 лет', fileType: 'PDF', program: 'ФОП ДО', section: 'free' },
  { id: 5, title: 'Конспект занятия "Осенние листья"', category: 'Планы занятий', ageGroup: '4–5 лет', fileType: 'PDF', program: 'ФОП ДО', section: 'subscription' },
  { id: 6, title: 'Годовой план воспитательной работы', category: 'Программы', ageGroup: '3–7 лет', fileType: 'DOCX', program: 'ФОП ДО', section: 'subscription' },
  { id: 7, title: 'Картотека дидактических игр', category: 'Игры', ageGroup: '3–5 лет', fileType: 'PDF', program: 'ФОП ДО', section: 'subscription' },
  { id: 8, title: 'Методические рекомендации по РППС', category: 'Методички', ageGroup: '3–7 лет', fileType: 'DOCX', program: 'ФАОП ДО', section: 'subscription' },
  { id: 9, title: 'Рабочая программа по ФОП ДО (полная)', category: 'Программы', ageGroup: '1–7 лет', fileType: 'DOCX', program: 'ФОП ДО', section: 'store', price: 390 },
  { id: 10, title: 'Диагностика речевого развития', category: 'Диагностика', ageGroup: '4–5 лет', fileType: 'PDF', program: 'ФАОП ДО', section: 'store', price: 180 },
  { id: 11, title: 'Комплект КТП на учебный год', category: 'КТП', ageGroup: '5–7 лет', fileType: 'DOCX', program: 'ФОП ДО', section: 'store', price: 490 },
];

const SECTIONS: { key: SectionKey; label: string; description: string; color: string; badge: string }[] = [
  {
    key: 'free',
    label: 'Бесплатно',
    description: 'Материалы, доступные после регистрации без оплаты',
    color: 'text-green-600',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  {
    key: 'subscription',
    label: 'По подписке',
    description: 'Расширенная библиотека — сотни материалов по подписке',
    color: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'store',
    label: 'Магазин',
    description: 'Отдельные документы и комплекты, доступные для покупки',
    color: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
];

const FILE_STYLES: Record<DemoMaterial['fileType'], { bg: string; text: string; icon: JSX.Element }> = {
  PDF: { bg: 'bg-red-50', text: 'text-red-600', icon: <FileText className="w-4 h-4" /> },
  DOCX: { bg: 'bg-blue-50', text: 'text-blue-600', icon: <File className="w-4 h-4" /> },
  PPT: { bg: 'bg-orange-50', text: 'text-orange-600', icon: <Presentation className="w-4 h-4" /> },
};

type GateReason = 'download' | 'save' | 'purchase';

export function CabinetPreview({ onNavigate }: CabinetPreviewProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('free');
  const [gateReason, setGateReason] = useState<GateReason | null>(null);

  const currentSection = SECTIONS.find(s => s.key === activeSection)!;
  const visibleMaterials = DEMO_MATERIALS.filter(m => m.section === activeSection);

  const handleGatedAction = (reason: GateReason) => {
    setGateReason(reason);
  };

  const gateMessage: Record<GateReason, string> = {
    download: 'Зарегистрируйтесь бесплатно, чтобы скачать материалы и сохранить их в кабинет.',
    save: 'Зарегистрируйтесь бесплатно, чтобы скачать материалы и сохранить их в кабинет.',
    purchase: 'Зарегистрируйтесь бесплатно, чтобы приобретать материалы из магазина.',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {gateReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setGateReason(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Действие доступно после регистрации</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {gateMessage[gateReason]}
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={() => onNavigate('register')} className="w-full justify-center">
                Зарегистрироваться бесплатно
              </Button>
              <button
                onClick={() => setGateReason(null)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
              >
                Продолжить просмотр
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

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-4">
            <Star className="w-3.5 h-3.5" />
            Предварительный просмотр
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Ваш методический кабинет
          </h1>
          <p className="text-gray-500 text-base max-w-xl">
            Это демо-версия кабинета. Вы можете смотреть материалы, но для скачивания и сохранения нужна регистрация.
          </p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                activeSection === s.key
                  ? `${s.badge} border`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">{currentSection.description}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {visibleMaterials.map(material => {
            const style = FILE_STYLES[material.fileType];
            return (
              <div
                key={material.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center flex-shrink-0 ${style.text}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {material.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md ${style.bg} ${style.text}`}>
                        {material.fileType}
                      </span>
                      <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-md">
                        {material.ageGroup}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{material.category}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  {activeSection === 'free' && (
                    <span className="text-xs text-green-600 font-medium">Бесплатно</span>
                  )}
                  {activeSection === 'subscription' && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <Lock className="w-3 h-3" />
                      По подписке
                    </span>
                  )}
                  {activeSection === 'store' && material.price && (
                    <span className="text-xs text-amber-700 font-semibold">{material.price} ₽</span>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleGatedAction('save')}
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                      title="Сохранить"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    {activeSection === 'store' ? (
                      <button
                        onClick={() => handleGatedAction('purchase')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Купить
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGatedAction('download')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Скачать
                      </button>
                    )}
                  </div>
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
