import { useState } from 'react';
import { Search, Gift } from 'lucide-react';
import { Input } from '../../components/Input';
import { MaterialDocCard } from '../../components/MaterialDocCard';
import { getMergedFreeMaterials } from '../../lib/cmsProducts';

interface FreeMaterialsProps {
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

const CATEGORIES = ['Все категории', 'Методички', 'Шаблоны', 'Документация', 'Справочники'];

export function FreeMaterials({ onNavigate, isAuthenticated = false }: FreeMaterialsProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все категории');

  const allFree = getMergedFreeMaterials();
  const filtered = allFree.filter(doc => {
    const matchesSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase()) || doc.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Все категории' || doc.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Бесплатные материалы</h1>
          <p className="text-gray-600 mt-1">Материалы, которые можно открыть и использовать бесплатно.</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
        <p className="text-sm text-green-800">
          Открывайте бесплатно. Для скачивания понадобится быстрая регистрация.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-green-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium mb-1">Ничего не найдено</p>
          <p className="text-sm">Попробуйте изменить поисковый запрос</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(doc => (
            <MaterialDocCard
              key={doc.id}
              doc={doc}
              onNavigate={onNavigate}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
