import { useState } from 'react';
import { Search, BookOpen, MapPin, Calendar, Lock, Share2, ExternalLink, ChevronDown, Send } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface AnswerBaseProps {
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

interface AnswerCard {
  id: number;
  slug: string;
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
}

const sampleAnswers: AnswerCard[] = [
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
    answerPreview: 'Ситуация, которую вы описываете, — это повторная адаптация. Важно организовать сокращённое пребывание (1–2 часа) с постепенным увеличением. Выберите для ребёнка «уголок безопасности» — любимое место в группе.',
    answerHidden: 'Используйте ритуалы прощания и встречи — стабильность очень важна. Привлекайте к деятельности, которая ребёнку нравится, не требуя общения с другими детьми сразу. Для родителей рекомендуйте: чёткое и уверенное прощание без затягивания.',
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
    answerPreview: 'По ФОП ДО обязательными документами воспитателя являются: рабочая программа (составляется на основе ООП ДО вашего учреждения), календарно-тематическое планирование на учебный год.',
    answerHidden: 'Также необходимы: план воспитательной работы, листы оценки индивидуального развития детей, журнал посещаемости группы, план работы с родителями. Рабочая программа должна включать целевой, содержательный и организационный разделы.',
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
    answerPreview: 'В этой ситуации важно прежде всего наладить контакт с родителями и узнать, посещает ли ребёнок занятия у внешнего логопеда. Как воспитатель вы можете создать речевую среду в группе.',
    answerHidden: 'Практические шаги: организуйте в группе речевые уголки с картинками, книгами с крупными иллюстрациями; используйте наглядные схемы при объяснении; давайте ребёнку роли, не требующие длинных реплик в ролевых играх.',
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
    answerHidden: 'Трансформируемость означает возможность менять пространство в зависимости от образовательной ситуации. Полифункциональность — использование предметов в разных видах деятельности. Особое внимание уделите зонированию.',
    program: 'ФОП ДО',
    groupAge: '3–7 лет',
  },
];

const TOPICS = [
  'Все темы',
  'Адаптация',
  'Документация',
  'Дети с ОВЗ',
  'Среда развития',
  'Работа с родителями',
  'Планирование',
];

const PROGRAMS = ['Все программы', 'ФОП ДО', 'ФАОП ДО'];

export function AnswerBase({ onNavigate, isAuthenticated = false }: AnswerBaseProps) {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Все темы');
  const [selectedProgram, setSelectedProgram] = useState('Все программы');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = sampleAnswers.filter(a => {
    const matchSearch = !search ||
      a.topic.toLowerCase().includes(search.toLowerCase()) ||
      a.question.toLowerCase().includes(search.toLowerCase());
    const matchTopic = selectedTopic === 'Все темы' || a.topic.includes(selectedTopic.replace('Все темы', ''));
    const matchProgram = selectedProgram === 'Все программы' || a.program === selectedProgram;
    return matchSearch && matchTopic && matchProgram;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">База ответов молодому специалисту</h1>
            <p className="text-gray-600 mt-0.5">Реальные вопросы и ответы от практикующих методистов</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">
            Часть ответов доступна только зарегистрированным пользователям.{' '}
            <button onClick={() => onNavigate('register')} className="font-semibold hover:underline">
              Зарегистрируйтесь бесплатно
            </button>
            {' '}— это займёт одну минуту.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Поиск по теме или тексту вопроса..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-2">Тема</p>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium ${
                    selectedTopic === t
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:w-48">
            <p className="text-xs font-medium text-gray-500 mb-2">Программа</p>
            <div className="flex flex-wrap gap-1.5">
              {PROGRAMS.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedProgram(p)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium ${
                    selectedProgram === p
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500">Ничего не найдено</p>
            <p className="text-sm mt-1">Попробуйте изменить запрос или фильтры</p>
          </div>
        ) : (
          filtered.map(answer => (
            <Card key={answer.id} className="hover:border-blue-200">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-900">{answer.name}, {answer.age} лет</span>
                {answer.position && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{answer.position}</span>
                  </>
                )}
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {answer.city}
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {answer.date}
                </span>
                <span className="ml-auto flex gap-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-medium">
                    {answer.program}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {answer.groupAge}
                  </span>
                </span>
              </div>

              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1.5">
                {answer.topic}
              </p>

              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {answer.question}
              </p>

              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ответ эксперта</p>
                <div className="relative">
                  <p className="text-sm text-gray-700 leading-relaxed">{answer.answerPreview}</p>

                  {!isAuthenticated ? (
                    <div className="relative mt-2">
                      <p className="text-sm text-gray-700 leading-relaxed blur-sm select-none" aria-hidden>
                        {answer.answerHidden}
                      </p>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white/90 to-transparent rounded-lg">
                        <Lock className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700 text-center mb-3 px-4">
                          Зарегистрируйтесь, чтобы увидеть полный ответ
                        </p>
                        <Button size="sm" onClick={() => onNavigate('register')}>
                          Зарегистрироваться бесплатно
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {expandedId === answer.id ? (
                        <p className="text-sm text-gray-700 leading-relaxed mt-2">{answer.answerHidden}</p>
                      ) : (
                        <button
                          onClick={() => setExpandedId(answer.id)}
                          className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <ChevronDown className="w-4 h-4" />
                          Открыть полностью
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => onNavigate(`answer/${answer.slug}`)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Открыть полностью
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Поделиться:</span>
                  <button className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors" title="ВКонтакте">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.6 0H2.4C1.08 0 0 1.08 0 2.4v19.2C0 22.92 1.08 24 2.4 24h19.2c1.32 0 2.4-1.08 2.4-2.4V2.4C24 1.08 22.92 0 21.6 0zm-4.8 8.4h-1.68c-.6 0-.72.24-.72.84V10.8h2.4l-.36 2.4h-2.04V20.4h-2.88V13.2H9.6v-2.4h1.92V9c0-2.04 1.2-3.12 3.12-3.12.84 0 1.68.12 2.52.12V8.4h-.36z"/>
                    </svg>
                  </button>
                  <button className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-600 transition-colors" title="Telegram">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                    </svg>
                  </button>
                  <button className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors" title="WhatsApp">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  <button className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors" title="Скопировать ссылку">
                    <Share2 className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-2">Не нашли ответ на свой вопрос?</h3>
        <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
          Задайте вопрос — наши специалисты ответят лично в течение 1–2 рабочих дней
        </p>
        <Button onClick={() => onNavigate('young-specialist')}>
          <Send className="w-4 h-4" />
          Задать вопрос
        </Button>
      </div>
    </div>
  );
}
