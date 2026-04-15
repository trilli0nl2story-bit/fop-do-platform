import { Breadcrumb } from '../../components/Breadcrumb';
import { SeoIntro } from '../../components/SeoIntro';
import { DocumentCard } from '../../components/DocumentCard';
import { RelatedLinks } from '../../components/RelatedLinks';
import { SubscriptionCta } from '../../components/SubscriptionCta';
import { SeoContentBlocks } from '../../components/SeoContentBlocks';
import { Footer } from '../../components/Footer';
import { ageGroups, getDocumentsByAge, categories } from '../../data/catalog';

interface AgePageProps {
  slug: string;
  onNavigate: (page: string) => void;
}

export function AgePage({ slug, onNavigate }: AgePageProps) {
  const age = ageGroups.find(a => a.slug === slug);
  const documents = getDocumentsByAge(slug);
  const nearbyAges = ageGroups.filter(a => a.slug !== slug).slice(0, 5);

  if (!age) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Возрастная группа не найдена</h1>
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
            { label: `Материалы для ${age.label}` },
          ]}
          onNavigate={onNavigate}
        />

        <SeoIntro
          title={`Материалы для детей ${age.label}`}
          description={age.description}
          seoTitle={`Материалы для детей ${age.label} — Методический кабинет`}
          seoDescription={age.description}
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
            <p className="text-gray-500">Документы для этой возрастной группы скоро появятся</p>
          </div>
        )}

        <SeoContentBlocks
          whoFor={['Воспитатель', 'Специалист', 'Старший воспитатель', 'Методист']}
          whatIncludes={[
            'Возрастные особенности развития',
            'Готовые планы и конспекты',
            'Соответствие ФГОС ДО',
            'Рекомендации по проведению',
          ]}
        />

        <RelatedLinks
          title="Другие возрастные группы"
          links={[
            ...nearbyAges.map(a => ({ label: `${a.label}`, page: `age/${a.slug}` })),
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
