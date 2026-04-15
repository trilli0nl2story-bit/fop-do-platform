import { Breadcrumb } from '../../components/Breadcrumb';
import { SeoIntro } from '../../components/SeoIntro';
import { DocumentCard } from '../../components/DocumentCard';
import { RelatedLinks } from '../../components/RelatedLinks';
import { SubscriptionCta } from '../../components/SubscriptionCta';
import { SeoContentBlocks } from '../../components/SeoContentBlocks';
import { Footer } from '../../components/Footer';
import { categories, getDocumentsByCategory } from '../../data/catalog';

interface CategoryPageProps {
  slug: string;
  onNavigate: (page: string) => void;
}

export function CategoryPage({ slug, onNavigate }: CategoryPageProps) {
  const category = categories.find(c => c.slug === slug);
  const documents = getDocumentsByCategory(slug);
  const otherCategories = categories.filter(c => c.slug !== slug);

  if (!category) {
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
            { label: category.name },
          ]}
          onNavigate={onNavigate}
        />

        <SeoIntro
          title={category.name}
          description={category.description}
          seoTitle={`${category.name} — Методический кабинет педагога`}
          seoDescription={category.description}
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
            <p className="text-gray-500">В этой категории пока нет документов</p>
          </div>
        )}

        <SeoContentBlocks
          whoFor={['Воспитатель', 'Старший воспитатель', 'Методист', 'Специалист']}
          whatIncludes={[
            'Готовые к использованию документы',
            'Соответствие ФОП ДО и ФАОП ДО',
            'Профессиональная редактура',
            'Возможность адаптации под свои нужды',
          ]}
        />

        <RelatedLinks
          title="Другие категории"
          links={otherCategories.map(c => ({ label: c.name, page: `category/${c.slug}` }))}
          onNavigate={onNavigate}
        />

        <SubscriptionCta onNavigate={onNavigate} />
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
