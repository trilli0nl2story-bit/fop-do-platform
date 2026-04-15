import { useState } from 'react';
import Link from 'next/link';
import { FileText, Eye, ShoppingCart, Check, Lock, Download, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { MaterialPreviewModal } from './MaterialPreviewModal';

export type AccessType = 'free' | 'subscription' | 'store';

export interface MaterialDoc {
  id: string | number;
  slug?: string;
  title: string;
  category: string;
  ageGroup: string;
  description: string;
  fileType: 'PDF' | 'DOCX' | 'PPT';
  program: string;
  programColor: string;
  price?: number;
  accessType: AccessType;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  PPT: 'bg-orange-50 text-orange-600',
};

const accessLabels: Record<AccessType, { label: string; className: string }> = {
  free: { label: 'Бесплатно', className: 'bg-green-100 text-green-700' },
  subscription: { label: 'Доступ по подписке', className: 'bg-amber-100 text-amber-700' },
  store: { label: 'Купить отдельно', className: 'bg-blue-100 text-blue-700' },
};

type ModalMode = 'preview' | 'download-gate' | 'success';

interface MaterialDocCardProps {
  doc: MaterialDoc;
  hasSubscription?: boolean;
  isAuthenticated?: boolean;
  isInCart?: boolean;
  onAddToCart?: (doc: MaterialDoc) => void;
  onNavigate?: (page: string) => void;
  popularityLabel?: string | null;
  /** Called when an authenticated user clicks "Скачать" on a free material. */
  onGrantFree?: (slug: string) => void;
  /** True while the grant request is in flight for this card. */
  grantLoading?: boolean;
  /** True after a successful grant for this card. */
  grantedFree?: boolean;
  /** True if the grant request failed for this card. */
  grantError?: boolean;
}

export function MaterialDocCard({
  doc,
  hasSubscription = false,
  isAuthenticated = false,
  isInCart = false,
  onAddToCart,
  onNavigate,
  popularityLabel,
  onGrantFree,
  grantLoading = false,
  grantedFree = false,
  grantError = false,
}: MaterialDocCardProps) {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const access = accessLabels[doc.accessType];

  const handlePreview = () => {
    if (doc.accessType === 'store') return;
    setModalMode('preview');
  };

  const handleDownloadClick = () => {
    if (doc.accessType === 'free') {
      if (!isAuthenticated) {
        setModalMode('download-gate');
      } else if (onGrantFree && doc.slug) {
        onGrantFree(doc.slug);
      } else {
        setModalMode('success');
      }
    } else if (doc.accessType === 'subscription') {
      if (!hasSubscription) {
        onNavigate?.('subscription');
      } else {
        setModalMode('success');
      }
    }
  };

  const handleConfirmDownload = () => {
    if (doc.accessType === 'free') {
      if (!isAuthenticated) {
        setModalMode('download-gate');
      } else {
        setModalMode('success');
      }
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="w-11 h-11 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h3
                  className="text-base font-semibold text-gray-900 leading-snug cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={handlePreview}
                >
                  {doc.title}
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${fileTypeColors[doc.fileType]}`}>
                  {doc.fileType}
                </span>
                {popularityLabel && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 flex-shrink-0">
                    <TrendingUp className="w-3 h-3" />
                    {popularityLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{doc.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                {!(doc.accessType === 'subscription' && hasSubscription) && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${access.className}`}>
                    {access.label}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  {doc.category}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${doc.programColor}`}>
                  {doc.program}
                </span>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {doc.ageGroup}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
            {doc.accessType === 'store' && doc.price && (
              <span className="text-xl font-bold text-gray-900">{doc.price} ₽</span>
            )}
            {doc.accessType === 'free' && (
              <span className="text-base font-bold text-green-600">Бесплатно</span>
            )}
            {doc.accessType === 'subscription' && hasSubscription && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Доступно
              </span>
            )}
            {doc.accessType === 'subscription' && !hasSubscription && (
              <span className="text-sm font-semibold text-amber-600">Доступ по подписке</span>
            )}

            <div className="flex sm:flex-col gap-2">
              {doc.accessType !== 'store' && (
                <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" onClick={handlePreview}>
                  <Eye className="w-4 h-4" />
                  Просмотр
                </Button>
              )}

              {doc.accessType === 'free' && (
                grantedFree ? (
                  <Button size="sm" className="flex-1 sm:flex-none bg-green-500 cursor-default" disabled>
                    <CheckCircle2 className="w-4 h-4" />
                    В кабинете
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600"
                    onClick={handleDownloadClick}
                    disabled={grantLoading}
                  >
                    {grantLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Добавление...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Скачать
                      </>
                    )}
                  </Button>
                )
              )}

              {doc.accessType === 'subscription' && !hasSubscription && (
                <Button
                  size="sm"
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                  onClick={handleDownloadClick}
                >
                  <Lock className="w-4 h-4" />
                  Открыть доступ
                </Button>
              )}

              {doc.accessType === 'subscription' && hasSubscription && (
                <Button size="sm" className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700" onClick={handleDownloadClick}>
                  <Download className="w-4 h-4" />
                  Скачать
                </Button>
              )}

              {doc.accessType === 'store' && (
                <Button
                  size="sm"
                  className={`flex-1 sm:flex-none ${isInCart ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  onClick={() => onAddToCart?.(doc)}
                >
                  {isInCart ? (
                    <>
                      <Check className="w-4 h-4" />
                      В корзине
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      В корзину
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Grant result messages */}
            {doc.accessType === 'free' && grantedFree && (
              <p className="text-xs text-green-700 text-right">
                Материал добавлен в{' '}
                <Link href="/kabinet" className="underline font-medium">
                  личный кабинет
                </Link>
              </p>
            )}
            {doc.accessType === 'free' && grantError && !grantedFree && (
              <p className="text-xs text-red-500 text-right">
                Не удалось добавить материал. Попробуйте ещё раз.
              </p>
            )}
          </div>
        </div>
      </div>

      {modalMode && onNavigate && doc.accessType !== 'store' && (
        <MaterialPreviewModal
          doc={doc}
          mode={modalMode}
          isAuthenticated={isAuthenticated}
          hasSubscription={hasSubscription}
          onClose={() => setModalMode(null)}
          onNavigate={onNavigate}
          onConfirmDownload={handleConfirmDownload}
        />
      )}
    </>
  );
}
