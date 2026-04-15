import { useState } from 'react';
import { CheckCircle, Clock, MessageCircle, User, ChevronRight, Send, Share2, ThumbsUp, HelpCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Textarea } from '../components/Textarea';

interface QuestionTicketProps {
  onNavigate: (page: string) => void;
}

type TicketStatus = 'new' | 'in_progress' | 'answered' | 'closed' | 'published';

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  new: {
    label: 'Новый',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Clock className="w-4 h-4" />,
    description: 'Вопрос получен и ожидает назначения специалиста',
  },
  in_progress: {
    label: 'В работе',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <MessageCircle className="w-4 h-4" />,
    description: 'Специалист изучает вопрос и готовит ответ',
  },
  answered: {
    label: 'Ответ дан',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Ответ подготовлен и опубликован ниже',
  },
  closed: {
    label: 'Закрыт',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Вопрос закрыт',
  },
  published: {
    label: 'Опубликован в базе',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: <Share2 className="w-4 h-4" />,
    description: 'Этот вопрос и ответ добавлены в базу знаний',
  },
};

const DEMO_STATUS: TicketStatus = 'answered';

export function QuestionTicket({ onNavigate }: QuestionTicketProps) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [thanksSent, setThanksSent] = useState(false);
  const [followUpSent, setFollowUpSent] = useState(false);

  const status = statusConfig[DEMO_STATUS];

  const handleThanks = () => setThanksSent(true);
  const handleFollowUp = () => {
    if (followUpText.trim()) {
      setFollowUpSent(true);
      setFollowUpOpen(false);
      setFollowUpText('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => onNavigate('young-specialist')}
          className="hover:text-blue-600 transition-colors"
        >
          Молодой специалист
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Вопрос #МС-2024-001</span>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
          <span className="text-sm text-gray-500">Отправлен 10 марта 2024</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
          Адаптация ребёнка к детскому саду после длительного перерыва
        </h1>
        <p className="text-sm text-teal-700 mt-2 font-medium">{status.description}</p>
      </div>

      <Card hover={false} className="mb-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Анна, 24 года · Воспитатель</p>
            <p className="text-xs text-gray-500">Новосибирск · Средняя группа (4–5 лет) · ФОП ДО</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Тема: Адаптация ребёнка к детскому саду</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Добрый день! В мою группу вернулся ребёнок 4 лет, который не посещал детский сад почти год
            из-за болезни. Он плачет каждое утро, не хочет оставаться, не идёт на контакт с другими детьми.
            Родители очень переживают. Подскажите, пожалуйста, как правильно организовать адаптацию
            и что можно порекомендовать родителям?
          </p>
        </div>
      </Card>

      <div className="space-y-4 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs font-medium px-2">Хронология</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div className="space-y-3">
          {[
            { time: '10 марта, 09:14', text: 'Вопрос отправлен', icon: <HelpCircle className="w-4 h-4 text-blue-500" />, muted: false },
            { time: '10 марта, 09:30', text: 'Назначен специалист: Елена Петрова', icon: <User className="w-4 h-4 text-amber-500" />, muted: false },
            { time: '11 марта, 14:22', text: 'Ответ подготовлен и отправлен', icon: <CheckCircle className="w-4 h-4 text-green-500" />, muted: false },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 py-0.5">
                <p className="text-sm text-gray-700">{item.text}</p>
                <p className="text-xs text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {DEMO_STATUS === 'answered' || DEMO_STATUS === 'published' ? (
        <Card hover={false} className="mb-5 border-green-200 bg-green-50/30">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Елена Петрова</p>
              <p className="text-xs text-gray-500">Эксперт-методист · 11 марта 2024</p>
            </div>
          </div>

          <div className="text-sm text-gray-700 leading-relaxed space-y-3">
            <p>
              Здравствуйте, Анна! Ситуация, которую вы описываете, — это повторная адаптация,
              и она действительно может быть сложнее первичной, так как ребёнок уже имеет опыт
              разлучения с близкими.
            </p>
            <p>
              <strong>Что важно сделать в первые дни:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Организуйте сокращённое пребывание (1–2 часа) с постепенным увеличением.</li>
              <li>Выберите для ребёнка «уголок безопасности» в группе — любимое место, где он может побыть.</li>
              <li>Используйте ритуалы прощания и встречи — стабильность очень важна.</li>
              <li>Привлекайте к деятельности, которая ребёнку нравится, не требуя общения с другими.</li>
            </ul>
            <p>
              <strong>Для родителей рекомендуйте:</strong> чёткое и уверенное прощание без затягивания,
              договорённость о времени возвращения (используйте понятные образы — «после тихого часа»),
              обязательный совместный вечер дома.
            </p>
            <p>
              При необходимости вы можете запросить в библиотеке готовый план адаптационных мероприятий
              или составить его через AI-помощника платформы.
            </p>
          </div>

          {!thanksSent && !followUpSent ? (
            <div className="mt-5 pt-4 border-t border-green-200 flex flex-col sm:flex-row gap-3">
              <Button
                size="sm"
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={handleThanks}
              >
                <ThumbsUp className="w-4 h-4" />
                Спасибо, помогло!
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => setFollowUpOpen(true)}
              >
                <MessageCircle className="w-4 h-4" />
                Задать уточняющий вопрос
              </Button>
            </div>
          ) : thanksSent ? (
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Спасибо за обратную связь! Вопрос будет закрыт.</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Уточняющий вопрос отправлен. Ответим в ближайшее время.</span>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card hover={false} className="mb-5 bg-gray-50">
          <div className="text-center py-6">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Ответ готовится</p>
            <p className="text-sm text-gray-400 mt-1">Обычно отвечаем в течение 1–2 рабочих дней</p>
          </div>
        </Card>
      )}

      {followUpOpen && (
        <Card hover={false} className="mb-5 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Уточняющий вопрос</h3>
          <Textarea
            placeholder="Напишите уточнение или дополнительный вопрос..."
            value={followUpText}
            onChange={e => setFollowUpText(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 mt-3">
            <Button size="sm" onClick={handleFollowUp} disabled={!followUpText.trim()}>
              <Send className="w-4 h-4" />
              Отправить
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setFollowUpOpen(false)}>
              Отмена
            </Button>
          </div>
        </Card>
      )}

      <Card hover={false}>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-gray-400" />
          Поделиться ответом
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Если ответ оказался полезным — поделитесь с коллегами
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.6 0H2.4C1.08 0 0 1.08 0 2.4v19.2C0 22.92 1.08 24 2.4 24h19.2c1.32 0 2.4-1.08 2.4-2.4V2.4C24 1.08 22.92 0 21.6 0zm-4.8 8.4h-1.68c-.6 0-.72.24-.72.84V10.8h2.4l-.36 2.4h-2.04V20.4h-2.88V13.2H9.6v-2.4h1.92V9c0-2.04 1.2-3.12 3.12-3.12.84 0 1.68.12 2.52.12V8.4h-.36z"/>
            </svg>
            ВКонтакте
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
            Telegram
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Скопировать ссылку
          </button>
        </div>
      </Card>
    </div>
  );
}
