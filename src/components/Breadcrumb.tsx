import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  page?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (page: string) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap gap-1 text-sm min-w-0">
        <li className="flex-shrink-0">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Главная</span>
          </button>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            {item.page ? (
              <button
                onClick={() => onNavigate(item.page!)}
                className="text-gray-400 hover:text-blue-500 transition-colors truncate"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-700 font-medium truncate">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
