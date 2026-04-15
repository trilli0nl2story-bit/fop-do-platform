import { ShoppingBag, BookOpen, HelpCircle, Star, Bot } from 'lucide-react';
import { Footer } from '../components/Footer';
import { ActionHero } from '../components/ActionHero';
import { SocialProofToast } from '../components/SocialProofToast';

interface LandingProps {
  onNavigate: (page: string) => void;
  isAuthenticated?: boolean;
}

const testimonials = [
  {
    text: 'Готовые КТП и конспекты занятий — это просто спасение! Раньше тратила выходные на планирование, теперь всё готово за 10 минут.',
    author: 'Марина Д., воспитатель, Казань',
  },
  {
    text: 'Все материалы соответствуют ФОП ДО — больше не нужно проверять каждый документ вручную. Это огромная экономия нервов.',
    author: 'Елена В., заведующая ДОУ, Самара',
  },
  {
    text: 'Помощник для создания документов работает лучше, чем я ожидала. Написала план мероприятий за 15 минут вместо двух часов.',
    author: 'Юлия М., методист, Уфа',
  },
];

export function Landing({ onNavigate, isAuthenticated = false }: LandingProps) {
  const platformSections = [
    {
      icon: <BookOpen className="w-7 h-7" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      title: 'Библиотека материалов',
      description: 'Готовые конспекты занятий, КТП, диагностика и методические материалы.',
    },
    {
      icon: <Bot className="w-7 h-7" />,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      title: 'Помощник для создания документов',
      description: 'Создавайте документы и конспекты занятий с помощью помощника.',
    },
    {
      icon: <ShoppingBag className="w-7 h-7" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      title: 'Магазин документов',
      description: 'Отдельные документы и комплекты, которые можно купить отдельно.',
    },
    {
      icon: <HelpCircle className="w-7 h-7" />,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Помощь молодому специалисту',
      description: 'Задайте вопрос и получите ответ от эксперта.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <SocialProofToast />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO */}
        <ActionHero onNavigate={onNavigate} isAuthenticated={isAuthenticated} />

        {/* TESTIMONIALS */}
        <div className="pb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5 text-center">
            Что говорят педагоги
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">"{t.text}"</p>
                <p className="text-xs text-gray-400 font-medium">{t.author}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT IS ON THE PLATFORM */}
        <div className="py-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Что есть на платформе</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {platformSections.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className={`w-12 h-12 ${s.iconBg} rounded-lg flex items-center justify-center ${s.iconColor} mb-4`}>
                  {s.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
