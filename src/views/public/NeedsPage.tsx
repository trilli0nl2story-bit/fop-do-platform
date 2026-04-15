import { Breadcrumb } from '../../components/Breadcrumb';
import { SeoIntro } from '../../components/SeoIntro';
import { DocumentCard } from '../../components/DocumentCard';
import { RelatedLinks } from '../../components/RelatedLinks';
import { SubscriptionCta } from '../../components/SubscriptionCta';
import { SeoContentBlocks } from '../../components/SeoContentBlocks';
import { Footer } from '../../components/Footer';
import { specialNeeds, getDocumentsByNeed, categories } from '../../data/catalog';

interface NeedsPageProps {
  slug: string;
  onNavigate: (page: string) => void;
}

export function NeedsPage({ slug, onNavigate }: NeedsPageProps) {
  const need = specialNeeds.find(n => n.slug === slug);
  const documents = getDocumentsByNeed(slug);
  const otherNeeds = specialNeeds.filter(n => n.slug !== slug);

  if (!need) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Категория не найдена</h1>
        <p className="text-gray-600">Попробуйте вернуться в библиотеку.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: 'Библиотека', page: 'library' },
            { label: 'Особенности развития', page: 'library' },
            { label: `${need.name} — ${need.fullName}` },
          ]}
          onNavigate={onNavigate}
        />

        <SeoIntro
          title={`${need.name} — ${need.fullName}`}
          description={need.description}
          seoTitle={`Материалы для работы с детьми с ${need.fullName} — Методический кабинет`}
          seoDescription={need.description}
        />

        {documents.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <DocumentCard
                key={doc.id}
                slug={doc.slug}
                title={doc.title}
                category={doc.category}
                ageGroup={`${doc.ageGroup} ${parseInt(doc.ageGroup.split('-')[1]) <= 3 ? 'года' : 'лет'}`}
                price={doc.price}
                fileType={doc.fileType}
                program={doc.program}
                description={doc.description}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Документы для этой категории скоро появятся</p>
          </div>
        )}

        <SeoContentBlocks
          whoFor={['Логопед', 'Дефектолог', 'Психолог', 'Воспитатель', 'Тьютор']}
          whatIncludes={[
            'Адаптированные образовательные материалы',
            'Коррекционные программы и планы',
            'Диагностические инструменты',
            'Индивидуальные маршруты развития',
            'Рекомендации для работы с родителями',
          ]}
        />

        <RelatedLinks
          title="Другие особенности развития"
          links={[
            ...otherNeeds.map(n => ({ label: `${n.name} — ${n.fullName}`, page: `needs/${n.slug}` })),
            { label: 'ФАОП ДО', page: 'program/faop-do' },
            ...categories.slice(0, 2).map(c => ({ label: c.name, page: `category/${c.slug}` })),
          ]}
          onNavigate={onNavigate}
        />

        <SubscriptionCta onNavigate={onNavigate} />
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
