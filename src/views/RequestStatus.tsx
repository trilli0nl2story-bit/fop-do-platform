import { CheckCircle, Circle, Clock, FileText, Download } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface RequestStatusProps {
  onNavigate: (page: string) => void;
}

export function RequestStatus({ onNavigate }: RequestStatusProps) {
  const statuses = [
    { id: 'received', label: 'Принят', completed: true, date: '15 марта, 14:30' },
    { id: 'in-progress', label: 'В работе', completed: true, date: '15 марта, 15:00' },
    { id: 'draft', label: 'Черновик создан', completed: true, date: '16 марта, 10:20' },
    { id: 'review', label: 'На проверке', completed: false, date: null },
    { id: 'ready', label: 'Готов', completed: false, date: null }
  ];

  const request = {
    id: 'REQ-2024-001',
    topic: 'Конспект занятия "Весенние цветы"',
    ageGroup: 'Средняя группа (4-5 лет)',
    documentType: 'Конспект занятия',
    description: 'Занятие по познавательному развитию с элементами творчества',
    createdDate: '15 марта 2024',
    estimatedCompletion: '18 марта 2024'
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-blue-500 hover:text-blue-600 mb-4 text-sm font-medium"
        >
          ← Назад к заказам
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Статус заказа</h1>
        <p className="text-gray-600">Отслеживайте прогресс выполнения вашего заказа</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card hover={false}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Информация о заказе</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {request.id}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Тема:</span>
                  <span className="font-medium text-gray-900">{request.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Группа:</span>
                  <span className="font-medium text-gray-900">{request.ageGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Тип документа:</span>
                  <span className="font-medium text-gray-900">{request.documentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата создания:</span>
                  <span className="font-medium text-gray-900">{request.createdDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ожидаемая готовность:</span>
                  <span className="font-medium text-gray-900">{request.estimatedCompletion}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-1">Описание:</p>
              <p className="text-gray-900">{request.description}</p>
            </div>
          </Card>

          <Card hover={false}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Этапы выполнения</h2>

            <div className="space-y-6">
              {statuses.map((status, index) => (
                <div key={status.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {status.completed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </div>
                    {index < statuses.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          status.completed ? 'bg-green-200' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <h3
                      className={`font-semibold mb-1 ${
                        status.completed ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {status.label}
                    </h3>
                    {status.date && (
                      <p className="text-sm text-gray-600">{status.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-4">
            <Card hover={false} className="bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">В процессе</h3>
                  <p className="text-sm text-gray-600">
                    Мы работаем над вашим заказом
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Ожидаемая готовность:<br />
                <span className="font-semibold text-gray-900">18 марта 2024</span>
              </p>
            </Card>

            <Card hover={false}>
              <h3 className="font-semibold text-gray-900 mb-3">Что дальше?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <div className="w-5 h-5 flex-shrink-0 text-blue-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p>Проверим черновик и внесём правки</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 flex-shrink-0 text-blue-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p>Оформим финальную версию</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 flex-shrink-0 text-blue-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p>Уведомим вас о готовности</p>
                </div>
              </div>
            </Card>

            <Card hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Черновик</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Предварительная версия документа готова для просмотра
              </p>
              <Button size="sm" variant="secondary" className="w-full">
                <Download className="w-4 h-4" />
                Скачать черновик
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
