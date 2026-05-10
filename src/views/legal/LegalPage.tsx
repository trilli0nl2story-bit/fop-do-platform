import { ArrowLeft } from 'lucide-react';
import { legalInfo } from '../../config/legalInfo';

interface LegalPageProps {
  title: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export function LegalPage({ title, onNavigate, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-6 border-b border-gray-200">
            {title}
          </h1>
          <div className="prose-like space-y-4 text-base leading-relaxed">
            {children}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            {legalInfo.legalName} &mdash; ИНН {legalInfo.inn} &mdash; ОГРНИП {legalInfo.ogrnip}
          </p>
        </div>
      </div>
    </div>
  );
}
