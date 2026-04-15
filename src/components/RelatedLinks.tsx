import { ArrowRight } from 'lucide-react';

interface RelatedLink {
  label: string;
  page: string;
}

interface RelatedLinksProps {
  title?: string;
  links: RelatedLink[];
  onNavigate: (page: string) => void;
}

export function RelatedLinks({ title = 'Смотрите также', links, onNavigate }: RelatedLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link, i) => (
          <button
            key={i}
            onClick={() => onNavigate(link.page)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
          >
            {link.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
