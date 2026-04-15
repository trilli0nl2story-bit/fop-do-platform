import { Lock, MapPin, Calendar, Share2, BookOpen, ArrowLeft, ChevronRight, Briefcase } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { catalogDocuments } from '../../data/catalog';

interface AnswerCard {
  id: number;
  name: string;
  age: number;
  city: string;
  date: string;
  topic: string;
  position: string;
  question: string;
  answerPreview: string;
  answerHidden: string;
  program: string;
  groupAge: string;
  slug: string;
}

const allAnswers: AnswerCard[] = [
  {
    id: 1,
    slug: 'adaptatsiya-rebyonka-k-detskomu-sadu',
    name: 'Анна',
    age: 24,
    city: 'Новосибирск',
    date: '11 марта 2024',
    topic: 'Адаптация ребёнка к детскому саду',
    position: 'Воспитатель',
    question: 'В мою группу вернулся ребёнок 4 лет, который не посещал детский сад почти год из-за болезни. Он плачет каждое утро, не хочет оставаться. Как правильно организовать адаптацию?',
    answerPreview: 'Ситуация, которую вы описываете, — это повторная адаптация. Важно организовать сокращённое пребывание (1–2 часа) с постепенным увеличением. Выберите для ребёнка «уголок безопасности» — любимое место в группе. Используйте ритуалы прощания и встречи — стабильность очень важна.',
    answerHidden: 'Привлекайте к деятельности, которая ребёнку нравится, не требуя общения с другими детьми сразу. Для родителей рекомендуйте: чёткое и уверенное прощание без затягивания. Избегайте долгих объяснений и оправданий — они усиливают тревогу. Поддерживайте регулярный контакт с семьёй в первые недели.',
    program: 'ФОП ДО',
    groupAge: '4–5 лет',
  },
  {
    id: 2,
    slug: 'dokumentatsiya-vospitatelya-fop-do',
    name: 'Марина',
    age: 26,
    city: 'Екатеринбург',
    date: '8 марта 2024',
    topic: 'Документация воспитателя по ФОП ДО',
    position: 'Воспитатель',
    question: 'Какие документы обязательно должны быть у воспитателя по новым требованиям ФОП ДО? Я только начала работать и запуталась в требованиях.',
    answerPreview: 'По ФОП ДО обязательными документами воспитателя являются: рабочая программа (составляется на основе ООП ДО вашего учреждения), календарно-тематическое планирование на учебный год. Также необходимы: план воспитательной работы, листы оценки индивидуального развития детей.',
    answerHidden: 'Также нужны: журнал посещаемости группы, план работы с родителями. Рабочая программа должна включать целевой, содержательный и организационный разделы. Рекомендую обратиться к методисту вашего ДОО — в каждом учреждении могут быть дополнительные формы.',
    program: 'ФОП ДО',
    groupAge: '3–4 года',
  },
  {
    id: 3,
    slug: 'rabota-s-detmi-s-tnr',
    name: 'Ольга',
    age: 23,
    city: 'Казань',
    date: '5 марта 2024',
    topic: 'Работа с детьми с ТНР в общеразвивающей группе',
    position: 'Воспитатель',
    question: 'В общеразвивающую группу перевели ребёнка с тяжёлым нарушением речи. Логопеда в саду нет. Что я как воспитатель могу сделать самостоятельно?',
    answerPreview: 'В этой ситуации важно прежде всего наладить контакт с родителями и узнать, посещает ли ребёнок занятия у внешнего логопеда. Как воспитатель вы можете создать речевую среду в группе: речевые уголки с картинками, книги с крупными иллюстрациями.',
    answerHidden: 'Используйте наглядные схемы при объяснении; давайте ребёнку роли, не требующие длинных реплик в ролевых играх. Проводите артикуляционные упражнения со всей группой — это не выделит ребёнка. Фиксируйте наблюдения и при возможности передавайте родителям рекомендации внешнего логопеда.',
    program: 'ФАОП ДО',
    groupAge: '5–6 лет',
  },
  {
    id: 4,
    slug: 'organizatsiya-rpps-fop-do',
    name: 'Светлана',
    age: 28,
    city: 'Самара',
    date: '1 марта 2024',
    topic: 'Организация предметно-пространственной среды',
    position: 'Старший воспитатель',
    question: 'Как правильно организовать развивающую предметно-пространственную среду в группе по требованиям ФОП ДО? На какие принципы опираться?',
    answerPreview: 'ФОП ДО выделяет ключевые характеристики РППС: содержательно-насыщенная, трансформируемая, полифункциональная, доступная и безопасная. Среда должна обеспечивать реализацию образовательных областей.',
    answerHidden: 'Трансформируемость означает возможность менять пространство в зависимости от образовательной ситуации. Полифункциональность — использование предметов в разных видах деятельности. Особое внимание уделите зонированию: выделите зоны активной, спокойной и творческой деятельности. Привлекайте детей к изменению среды.',
    program: 'ФОП ДО',
    groupAge: '3–7 лет',
  },
];

interface AnswerDetailProps {
  slug: string;
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

export function AnswerDetail({ slug, onNavigate, isAuthenticated = false }: AnswerDetailProps) {
  const answer = allAnswers.find(a => a.slug === slug);

  if (!answer) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg mb-4">Ответ не найден</p>
        <Button onClick={() => onNavigate('answer-base')}>
          <ArrowLeft className="w-4 h-4" />
          Вернуться к базе ответов
        </Button>
      </div>
    );
  }

  const related = allAnswers.filter(a => a.id !== answer.id).slice(0, 3);
  const relatedDocs = catalogDocuments
    .filter(d => d.program === answer.program)
    .slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => onNavigate('answer-base')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        База ответов
      </button>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">{answer.program}</span>
          <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{answer.groupAge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-2">
          {answer.topic}
        </h1>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{answer.topic}</p>
      </div>

      <Card hover={false} className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Вопрос</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{answer.name}, {answer.age} лет</span>
          {answer.position && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              {answer.position}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {answer.city}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {answer.date}
          </span>
        </div>

        <p className="text-base text-gray-800 leading-relaxed">{answer.question}</p>
      </Card>

      <Card hover={false} className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Ответ эксперта</p>

        <p className="text-base text-gray-800 leading-relaxed mb-4">{answer.answerPreview}</p>

        {!isAuthenticated ? (
          <div className="relative">
            <p className="text-base text-gray-700 leading-relaxed blur-sm select-none" aria-hidden>
              {answer.answerHidden}
            </p>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white/90 to-transparent rounded-lg px-4">
              <Lock className="w-7 h-7 text-gray-400 mb-3" />
              <p className="text-base font-medium text-gray-700 text-center mb-4 max-w-xs">
                Зарегистрируйтесь бесплатно, чтобы увидеть полный ответ.
              </p>
              <Button onClick={() => onNavigate('register')}>
                Зарегистрироваться бесплатно
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base text-gray-800 leading-relaxed">{answer.answerHidden}</p>
        )}
      </Card>

      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-center">
          <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Хотите видеть все ответы полностью?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Зарегистрируйтесь бесплатно — это займёт одну минуту.
          </p>
          <Button onClick={() => onNavigate('register')}>
            Зарегистрироваться бесплатно
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-gray-500">Поделиться:</span>
        <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors" title="ВКонтакте">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.6 0H2.4C1.08 0 0 1.08 0 2.4v19.2C0 22.92 1.08 24 2.4 24h19.2c1.32 0 2.4-1.08 2.4-2.4V2.4C24 1.08 22.92 0 21.6 0zm-4.8 8.4h-1.68c-.6 0-.72.24-.72.84V10.8h2.4l-.36 2.4h-2.04V20.4h-2.88V13.2H9.6v-2.4h1.92V9c0-2.04 1.2-3.12 3.12-3.12.84 0 1.68.12 2.52.12V8.4h-.36z"/>
          </svg>
        </button>
        <button className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-600 transition-colors" title="Telegram">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
          </svg>
        </button>
        <button className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors" title="WhatsApp">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
        <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors" title="Скопировать ссылку">
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {related.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Похожие вопросы</h2>
          <div className="space-y-3">
            {related.map(r => (
              <button
                key={r.id}
                onClick={() => onNavigate(`answer/${r.slug}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{r.topic}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{r.question}</p>
                    <p className="text-xs text-gray-400 mt-2">{r.name}, {r.city} · {r.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {relatedDocs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Материалы по теме</h2>
          <div className="space-y-3">
            {relatedDocs.map(doc => (
              <button
                key={doc.id}
                onClick={() => onNavigate(`document/${doc.slug}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">{doc.fileType}</span>
                      <span className="text-xs text-gray-400">{doc.category}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{doc.author} · {doc.price} ₽</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate('library')}
            className="mt-4 text-sm text-blue-600 hover:underline font-medium"
          >
            Смотреть все материалы →
          </button>
        </div>
      )}
    </div>
  );
}
