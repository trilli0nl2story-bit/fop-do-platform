import { FileText, Eye, ShoppingCart } from 'lucide-react';
import { Button } from './Button';

interface DocumentCardProps {
  slug: string;
  title: string;
  category: string;
  ageGroup: string;
  price: number;
  fileType: string;
  program: string;
  description: string;
  onNavigate: (page: string) => void;
}

const fileTypeColors: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  PPT: 'bg-orange-50 text-orange-600',
};

const programColors: Record<string, string> = {
  'ФОП ДО': 'bg-teal-50 text-teal-700',
  'ФАОП ДО': 'bg-sky-50 text-sky-700',
  'Универсальный': 'bg-gray-100 text-gray-600',
};

export function DocumentCard({ slug, title, category, ageGroup, price, fileType, program, description, onNavigate }: DocumentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onNavigate(`document/${slug}`)}
            className="text-left"
          >
            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors leading-snug text-sm">
              {title}
            </h3>
          </button>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{category}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${programColors[program] || 'bg-gray-100 text-gray-600'}`}>{program}</span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{ageGroup}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${fileTypeColors[fileType] || 'bg-gray-100 text-gray-600'}`}>{fileType}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-lg font-bold text-gray-900 flex-shrink-0">{price} ₽</span>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={() => onNavigate(`document/${slug}`)}>
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Подробнее</span>
          </Button>
          <Button size="sm">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">В корзину</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
