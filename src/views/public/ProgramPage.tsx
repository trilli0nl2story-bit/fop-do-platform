import { Breadcrumb } from '../../components/Breadcrumb';
import { SeoIntro } from '../../components/SeoIntro';
import { DocumentCard } from '../../components/DocumentCard';
import { RelatedLinks } from '../../components/RelatedLinks';
import { SubscriptionCta } from '../../components/SubscriptionCta';
import { SeoContentBlocks } from '../../components/SeoContentBlocks';
import { Footer } from '../../components/Footer';
import { programs, getDocumentsByProgram, categories } from '../../data/catalog';

interface ProgramPageProps {
  slug: string;
  onNavigate: (page: string) => void;
}

export function ProgramPage({ slug, onNavigate }: ProgramPageProps) {
  const program = programs.find(p => p.slug === slug);
  const documents = getDocumentsByProgram(slug);
  const otherPrograms = programs.filter(p => p.slug !== slug);

  if (!program) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Программа не найдена</h1>
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
            { label: `Материалы по ${program.name}` },
          ]}
          onNavigate={onNavigate}
        />

        <SeoIntro
          title={`Материалы по ${program.name}`}
          description={program.description}
          seoTitle={`${program.fullName} — документы для педагогов`}
          seoDescription={program.description}
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
            <p className="text-gray-500">Документы по этой программе скоро появятся</p>
          </div>
        )}

        <SeoContentBlocks
          whoFor={['Воспитатель', 'Старший воспитатель', 'Методист', 'Логопед', 'Дефектолог']}
          whatIncludes={[
            'Документы по выбранной программе',
            'Актуальные нормативные требования',
            'Практические материалы для ежедневной работы',
            'Готовые шаблоны и образцы',
          ]}
        />

        <RelatedLinks
          title="Другие программы"
          links={[
            ...otherPrograms.map(p => ({ label: p.name, page: `program/${p.slug}` })),
            ...categories.slice(0, 3).map(c => ({ label: c.name, page: `category/${c.slug}` })),
          ]}
          onNavigate={onNavigate}
        />

        <SubscriptionCta onNavigate={onNavigate} />
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
