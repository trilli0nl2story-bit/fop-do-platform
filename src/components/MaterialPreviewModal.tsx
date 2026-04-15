import { X, FileText, Check, Crown, Download, ArrowLeft } from 'lucide-react';
import type { MaterialDoc } from './MaterialDocCard';

interface MaterialPreviewModalProps {
  doc: MaterialDoc;
  mode: 'preview' | 'download-gate' | 'success';
  isAuthenticated: boolean;
  hasSubscription: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onConfirmDownload?: () => void;
}

const PREVIEW_CONTENT: Record<number, { whatsInside: string[]; howToUse: string[]; previewText: string }> = {};

function getPreviewData(doc: MaterialDoc) {
  if (PREVIEW_CONTENT[doc.id]) return PREVIEW_CONTENT[doc.id];
  return {
    whatsInside: [
      'Готовый шаблон, соответствующий ФОП ДО',
      'Структурированное содержание по теме',
      'Рекомендации по использованию',
      'Вариант адаптации для разных групп',
    ],
    howToUse: [
      'Откройте файл в Word или распечатайте',
      'Заполните данные вашей группы',
      'Используйте сразу или адаптируйте',
    ],
    previewText:
      `${doc.title}\n\nКатегория: ${doc.category}\nВозрастная группа: ${doc.ageGroup}\n\n[Фрагмент документа]\nМатериал разработан в соответствии с действующей программой и методическими рекомендациями. Готов к использованию и печати...`,
  };
}

export function MaterialPreviewModal({
  doc,
  mode,
  isAuthenticated,
  hasSubscription,
  onClose,
  onNavigate,
  onConfirmDownload,
}: MaterialPreviewModalProps) {
  const preview = getPreviewData(doc);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (mode === 'download-gate') {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-7 pb-2">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Бесплатный материал</p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">
              Зарегистрируйтесь, чтобы скачать бесплатный материал
            </h3>
            <p className="text-sm text-gray-500 mt-1">Это бесплатно и займёт около 30 секунд</p>
          </div>

          <div className="mx-6 my-4 bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 font-medium mb-2">Вы скачиваете:</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug">{doc.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-500">{doc.fileType}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-green-600 font-medium">Бесплатно</span>
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-3">
            <button
              onClick={() => { onClose(); onNavigate('register'); }}
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Зарегистрироваться бесплатно
            </button>
            <button
              onClick={() => { onClose(); onNavigate('login'); }}
              className="w-full py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
            >
              Войти в существующий аккаунт
            </button>
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center">
              Вернуться к материалам
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'success') {
    const isFree = doc.accessType === 'free';
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-8 pb-2 text-center">
            <div className={`w-14 h-14 ${isFree ? 'bg-green-100' : 'bg-amber-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <Check className={`w-7 h-7 ${isFree ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {isFree ? 'Материал добавлен в «Мои материалы»' : 'Материал доступен'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{doc.title}</p>
          </div>

          <div className="px-6 pb-6 mt-5 flex flex-col gap-3">
            <button
              onClick={() => { onClose(); onNavigate('my-documents'); }}
              className={`w-full py-3.5 ${isFree ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-semibold rounded-xl transition-colors text-sm`}
            >
              Открыть мои материалы
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
            >
              {isFree ? 'Вернуться к бесплатным материалам' : 'Вернуться к материалам по подписке'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showSubscribeCta = doc.accessType === 'subscription' && !hasSubscription;
  const showDownloadCta = doc.accessType === 'free' || (doc.accessType === 'subscription' && hasSubscription);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            doc.fileType === 'PDF' ? 'bg-red-50 text-red-600' :
            doc.fileType === 'PPT' ? 'bg-orange-50 text-orange-600' :
            'bg-blue-50 text-blue-600'
          }`}>{doc.fileType}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{doc.title}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">{doc.category}</span>
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{doc.ageGroup}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${doc.programColor}`}>{doc.program}</span>
                  {doc.accessType === 'free' && (
                    <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">Бесплатно</span>
                  )}
                  {doc.accessType === 'subscription' && (
                    <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">По подписке</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{doc.description}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Что внутри</p>
            <ul className="space-y-1.5">
              {preview.whatsInside.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Как использовать</p>
            <ul className="space-y-1.5">
              {preview.howToUse.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Фрагмент</p>
              <span className="text-xs text-gray-400">предварительный просмотр</span>
            </div>
            <div className="relative px-4 py-4">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed line-clamp-6">
                {preview.previewText}
              </pre>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0 space-y-2.5">
          {showDownloadCta && (
            <button
              onClick={onConfirmDownload}
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Скачать бесплатно
            </button>
          )}
          {showSubscribeCta && (
            <button
              onClick={() => { onClose(); onNavigate('subscription'); }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Оформить подписку
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors text-center"
          >
            Назад к материалам
          </button>
        </div>
      </div>
    </div>
  );
}
