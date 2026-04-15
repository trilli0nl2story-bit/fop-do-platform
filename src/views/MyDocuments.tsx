import { useState } from 'react';
import { FileText, Download, Eye, Star, Trash2, CheckCircle, ShoppingBag } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

type Tab = 'purchased' | 'subscription' | 'generated' | 'favorites';

interface DocItem {
  id: number;
  title: string;
  category: string;
  date: string;
  size: string;
  fileType: 'PDF' | 'DOCX' | 'PPT';
  price?: number;
  author?: string;
}

const fileTypeBadge: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  DOCX: 'bg-blue-50 text-blue-600',
  PPT: 'bg-orange-50 text-orange-600'
};

const documents: Record<Tab, DocItem[]> = {
  purchased: [
    { id: 1, title: 'Конспект занятия "Осенние листья"', category: 'Планы занятий', date: '15 марта 2024', size: '2.4 MB', fileType: 'PDF', price: 149, author: 'Елена Козлова' },
    { id: 2, title: 'Рабочая программа по ФОП ДО', category: 'Программы', date: '14 марта 2024', size: '5.1 MB', fileType: 'DOCX', price: 249, author: 'Анна Морозова' },
    { id: 3, title: 'Методические рекомендации', category: 'Методички', date: '13 марта 2024', size: '1.8 MB', fileType: 'DOCX', price: 180, author: 'Ольга Петрова' }
  ],
  subscription: [
    { id: 7, title: 'Годовой план воспитательной работы', category: 'Программы', date: '20 марта 2024', size: '3.6 MB', fileType: 'DOCX' },
    { id: 8, title: 'Картотека игр по ФЭМП', category: 'Методички', date: '18 марта 2024', size: '1.4 MB', fileType: 'PDF' }
  ],
  generated: [
    { id: 4, title: 'Занятие "В мире животных"', category: 'Создано AI', date: '12 марта 2024', size: '1.2 MB', fileType: 'DOCX' },
    { id: 5, title: 'План проекта "Весна идет"', category: 'Создано AI', date: '11 марта 2024', size: '890 KB', fileType: 'DOCX' }
  ],
  favorites: [
    { id: 6, title: 'Диагностика развития детей', category: 'Диагностика', date: '10 марта 2024', size: '3.2 MB', fileType: 'PDF' }
  ]
};

const tabConfig: { id: Tab; label: string }[] = [
  { id: 'purchased', label: 'Купленные' },
  { id: 'subscription', label: 'По подписке' },
  { id: 'generated', label: 'Созданные' },
  { id: 'favorites', label: 'Избранное' }
];

export function MyDocuments() {
  const [activeTab, setActiveTab] = useState<Tab>('purchased');

  const currentDocuments = documents[activeTab];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои документы</h1>
        <p className="text-gray-600">Все ваши материалы в одном месте</p>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-0 border-b border-gray-200 min-w-max">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {documents[tab.id].length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentDocuments.map((doc) => (
          <Card key={doc.id} className="hover:border-blue-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{doc.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-gray-500">{doc.category}</p>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${fileTypeBadge[doc.fileType]}`}>
                    {doc.fileType}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-amber-500 transition-colors flex-shrink-0">
                <Star className="w-5 h-5" />
              </button>
            </div>

            {activeTab === 'purchased' && doc.price && (
              <div className="flex items-center gap-4 mb-3 p-2.5 bg-green-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Куплен</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="text-xs">{doc.price} ₽</span>
                </div>
                {doc.author && (
                  <span className="text-xs text-gray-500 ml-auto">Автор: {doc.author}</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{doc.date}</span>
              <span>{doc.size}</span>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1">
                <Eye className="w-4 h-4" />
                Открыть
              </Button>
              <Button size="sm" className="flex-1">
                <Download className="w-4 h-4" />
                Скачать
              </Button>
              {activeTab !== 'purchased' && (
                <Button size="sm" variant="ghost" className="px-3">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {currentDocuments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Пока здесь пусто</h3>
          <p className="text-gray-600">Документы появятся после покупки или создания</p>
        </div>
      )}
    </div>
  );
}
