import { FileText, Eye, ShoppingCart, Crown, Download, Star, Clock } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Breadcrumb } from '../../components/Breadcrumb';
import { RelatedLinks } from '../../components/RelatedLinks';
import { SubscriptionCta } from '../../components/SubscriptionCta';
import { getDocumentBySlug, catalogDocuments, categories } from '../../data/catalog';
import { Footer } from '../../components/Footer';
import { DocumentActivityBadge } from '../../components/DocumentActivityBadge';
import { randomDownloadCount } from '../../data/notifications';

interface DocumentDetailProps {
  slug: string;
  onNavigate: (page: string) => void;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600 border-red-200',
  DOCX: 'bg-blue-50 text-blue-600 border-blue-200',
  PPT: 'bg-orange-50 text-orange-600 border-orange-200',
};

const needLabels: Record<string, string> = {
  tnr: 'ТНР', zpr: 'ЗПР', ras: 'РАС', onr: 'ОНР',
};

function getDocContext(categorySlug: string): string {
  if (categorySlug.includes('ktp') || categorySlug.includes('комплексно')) return 'ktp';
  if (categorySlug.includes('diagnostik') || categorySlug.includes('диагност')) return 'diagnostics';
  if (categorySlug.includes('igr') || categorySlug.includes('kvest') || categorySlug.includes('досуг')) return 'games';
  if (categorySlug.includes('rodit') || categorySlug.includes('собрание')) return 'parents';
  if (categorySlug.includes('prazdnik') || categorySlug.includes('scenarij') || categorySlug.includes('мероприяти')) return 'events';
  if (categorySlug.includes('programm')) return 'program';
  return 'default';
}

export function DocumentDetail({ slug, onNavigate }: DocumentDetailProps) {
  const doc = getDocumentBySlug(slug);

  if (!doc) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Документ не найден</h1>
        <p className="text-gray-600 mb-6">Возможно, он был удалён или ссылка устарела.</p>
        <Button onClick={() => onNavigate('library')}>Перейти в библиотеку</Button>
      </div>
    );
  }

  const related = catalogDocuments
    .filter(d => d.id !== doc.id && (d.categorySlug === doc.categorySlug || d.programSlug === doc.programSlug))
    .slice(0, 3);

  const category = categories.find(c => c.slug === doc.categorySlug);
  const docContext = getDocContext(doc.categorySlug ?? '');
  const downloadCount = randomDownloadCount();

  const breadcrumbItems = [
    { label: 'Библиотека', page: 'library' },
    ...(category ? [{ label: category.name, page: `category/${category.slug}` }] : []),
    { label: doc.title },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} onNavigate={onNavigate} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{doc.title}</h1>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">{doc.category}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${doc.program === 'ФОП ДО' ? 'bg-teal-50 text-teal-700' : doc.program === 'ФАОП ДО' ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>
                {doc.program}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{doc.ageGroup.replace('-', '-')} {parseInt(doc.ageGroup.split('-')[1]) <= 3 ? 'года' : 'лет'}</span>
              {doc.developmentFeature !== 'none' && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                  {needLabels[doc.developmentFeature]}
                </span>
              )}
              <span className={`px-3 py-1 border rounded-full text-sm font-bold ${fileTypeColors[doc.fileType]}`}>
                {doc.fileType}
              </span>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Описание</h2>
              <p className="text-gray-600 leading-relaxed">{doc.description}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Предпросмотр</h2>
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Eye className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Предпросмотр документа</p>
                  <p className="text-xs mt-1">Доступен после покупки или по подписке</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <Eye className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{doc.views}</p>
                <p className="text-xs text-gray-500">просмотров</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <Download className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{doc.downloads}</p>
                <p className="text-xs text-gray-500">скачиваний</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">4.8</p>
                <p className="text-xs text-gray-500">рейтинг</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <Card hover={false}>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-gray-900">{doc.price} ₽</p>
                  <p className="text-xs text-gray-500 mt-1">Разовая покупка</p>
                </div>

                <div className="space-y-3 mb-4">
                  <Button className="w-full" size="lg">
                    <ShoppingCart className="w-5 h-5" />
                    Купить документ
                  </Button>
                  <Button variant="secondary" className="w-full">
                    <ShoppingCart className="w-4 h-4" />
                    Добавить в корзину
                  </Button>
                </div>

                <DocumentActivityBadge context={docContext} downloadCount={downloadCount} className="mb-4" />

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => onNavigate('subscription')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium hover:bg-amber-100 transition-colors"
                  >
                    <Crown className="w-4 h-4" />
                    Доступ по подписке — 278 ₽/мес
                  </button>
                </div>
              </Card>

              <Card hover={false}>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">О документе</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Формат</dt>
                    <dd className="font-medium text-gray-900">{doc.fileType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Программа</dt>
                    <dd className="font-medium text-gray-900">{doc.program}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Возраст</dt>
                    <dd className="font-medium text-gray-900">{doc.ageGroup.replace('-', '-')} {parseInt(doc.ageGroup.split('-')[1]) <= 3 ? 'года' : 'лет'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Автор</dt>
                    <dd className="font-medium text-gray-900">{doc.author}</dd>
                  </div>
                  {doc.developmentFeature !== 'none' && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Особенности</dt>
                      <dd className="font-medium text-amber-700">{needLabels[doc.developmentFeature]}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Похожие документы</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map(d => (
                <Card key={d.id} onClick={() => onNavigate(`document/${d.slug}`)} className="cursor-pointer">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{d.title}</h3>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-500">{d.category}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${fileTypeColors[d.fileType]}`}>{d.fileType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">{d.price} ₽</span>
                    <span className="text-xs text-gray-400">{d.views} просмотров</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <SubscriptionCta onNavigate={onNavigate} />
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
