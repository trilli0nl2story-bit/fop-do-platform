import { useState } from 'react';
import { Package, Lightbulb, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';
import { ConsentCheckbox } from '../components/ConsentCheckbox';

interface RequestDocumentProps {
  onNavigate: (page: string) => void;
}

export function RequestDocument({ onNavigate }: RequestDocumentProps) {
  const [formData, setFormData] = useState({
    topic: '',
    ageGroup: '',
    documentType: '',
    description: ''
  });
  const [consentGiven, setConsentGiven] = useState(false);

  const ageGroupOptions = [
    { value: '', label: 'Выберите группу' },
    { value: 'junior', label: 'Младшая группа (3-4 года)' },
    { value: 'middle', label: 'Средняя группа (4-5 лет)' },
    { value: 'senior', label: 'Старшая группа (5-6 лет)' },
    { value: 'prep', label: 'Подготовительная группа (6-7 лет)' }
  ];

  const documentTypeOptions = [
    { value: '', label: 'Выберите тип документа' },
    { value: 'lesson-plan', label: 'Конспект занятия' },
    { value: 'program', label: 'Рабочая программа' },
    { value: 'project', label: 'Проект' },
    { value: 'diagnostic', label: 'Диагностические материалы' },
    { value: 'methodical', label: 'Методические рекомендации' },
    { value: 'other', label: 'Другое' }
  ];

  const tips = [
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: 'Будьте конкретны',
      description: 'Чем подробнее описание, тем точнее будет результат'
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Сроки выполнения',
      description: 'Обычно подготовка занимает 2-3 рабочих дня'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Соответствие требованиям',
      description: 'Все материалы соответствуют ФОП ДО'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('request-status');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">Заказать документ</h1>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">ручная обработка</span>
            </div>
            <p className="text-gray-600">Опишите, какой материал вам нужен</p>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
          Заявки обрабатываются вручную. Мы свяжемся с вами или добавим статус в кабинет после обработки.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card hover={false}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Тема материала"
                placeholder="Например: Занятие по экологии 'Осенний лес'"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />

              <Select
                label="Возрастная группа"
                options={ageGroupOptions}
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                required
              />

              <Select
                label="Тип документа"
                options={documentTypeOptions}
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                required
              />

              <Textarea
                label="Подробное описание"
                placeholder="Опишите подробно, что должно быть в материале: цели, задачи, структура, особые требования..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={8}
                required
              />

              <ConsentCheckbox
                checked={consentGiven}
                onChange={setConsentGiven}
                onNavigate={onNavigate}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" size="lg" className="flex-1" disabled={!consentGiven}>
                  Отправить заказ
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-4">
            <Card hover={false} className="bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Полезные советы</h3>
              <div className="space-y-4">
                {tips.map((tip, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                      {tip.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{tip.title}</h4>
                      <p className="text-sm text-gray-600">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card hover={false}>
              <h3 className="font-semibold text-gray-900 mb-3">Примеры запросов</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">"Нужен конспект занятия по развитию речи для средней группы на тему 'Зимние забавы'"</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">"Рабочая программа воспитателя для старшей группы по ФОП ДО"</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
