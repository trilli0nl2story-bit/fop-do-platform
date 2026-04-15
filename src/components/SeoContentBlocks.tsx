import { BookOpen, Users, FileText, CheckCircle } from 'lucide-react';

interface SeoContentBlocksProps {
  whoFor?: string[];
  whatIncludes?: string[];
}

export function SeoContentBlocks({ whoFor, whatIncludes }: SeoContentBlocksProps) {
  return (
    <div className="mt-10 space-y-8">
      {whatIncludes && whatIncludes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Что включено в материалы</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {whatIncludes.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {whoFor && whoFor.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Для кого эти материалы</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {whoFor.map((role, i) => (
              <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Рекомендуемые материалы</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Все документы разработаны практикующими педагогами и методистами, соответствуют требованиям
          ФОП ДО и ФАОП ДО. Материалы прошли профессиональную редактуру и готовы к использованию
          в образовательном процессе.
        </p>
      </div>
    </div>
  );
}
