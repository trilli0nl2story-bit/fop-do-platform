import { useState } from 'react';
import { Copy, Check, Users, Gift, Share2, ChevronRight, Crown, Send } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Referral() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://fop-do.ru/ref/ABC123';
  const inviteCount = 3;

  const milestones = [
    { count: 3, reward: '7 дней Премиум', reached: inviteCount >= 3 },
    { count: 5, reward: '1 месяц Премиум', reached: inviteCount >= 5 },
    { count: 10, reward: '3 месяца Премиум', reached: inviteCount >= 10 },
    { count: 20, reward: '6 месяцев Премиум', reached: inviteCount >= 20 },
    { count: 50, reward: '1 год Премиум', reached: inviteCount >= 50 }
  ];

  const nextMilestone = milestones.find(m => !m.reached);
  const toNext = nextMilestone ? nextMilestone.count - inviteCount : 0;

  const progressPct = nextMilestone
    ? Math.round((inviteCount / nextMilestone.count) * 100)
    : 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const invitedFriends = [
    { name: 'Анна Смирнова', date: '14 марта 2024', status: 'Зарегистрировалась' },
    { name: 'Елена Козлова', date: '12 марта 2024', status: 'Зарегистрировалась' },
    { name: 'Ольга Петрова', date: '10 марта 2024', status: 'Зарегистрировалась' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Пригласить коллег</h1>
            <p className="text-gray-600">Приглашайте коллег и получайте Premium</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card hover={false}>
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Ваша реферальная ссылка</h2>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono truncate">
              {referralLink}
            </div>
            <Button
              variant="secondary"
              onClick={handleCopy}
              className={copied ? 'border-green-300 text-green-600 bg-green-50' : ''}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-3 font-medium">Поделиться:</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Присоединяйся к Методическому кабинету!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Telegram
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Присоединяйся к Методическому кабинету! ' + referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={`https://vk.com/share.php?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent('Методический кабинет педагога')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                VK
              </a>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-lg">Прогресс</h2>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{inviteCount}</span>
              <span className="text-gray-500 text-sm">приглашений</span>
            </div>
          </div>

          {nextMilestone && (
            <>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">До уровня "{nextMilestone.reward}"</span>
                  <span className="font-medium text-gray-900">{inviteCount} / {nextMilestone.count}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">
                  До следующего уровня осталось {toNext} {toNext === 1 ? 'приглашение' : 'приглашения'}
                </p>
              </div>
            </>
          )}
        </Card>
      </div>

      <Card hover={false} className="mb-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-5">Уровни наград</h2>
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                m.reached
                  ? 'bg-green-50 border-green-200'
                  : inviteCount > 0 && milestones[i - 1]?.reached
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                m.reached
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-400'
              }`}>
                {m.reached ? <Check className="w-5 h-5" /> : m.count}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${m.reached ? 'text-green-800' : 'text-gray-900'}`}>
                  {m.count} {m.count < 5 ? 'приглашения' : 'приглашений'}
                </p>
                <p className={`text-sm ${m.reached ? 'text-green-600' : 'text-gray-500'}`}>{m.reward}</p>
              </div>
              {m.reached && (
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Получено
                </span>
              )}
              {!m.reached && (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card hover={false} className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Особое вознаграждение</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Пригласите <span className="font-bold text-amber-700">50 коллег</span>, и если не менее{' '}
              <span className="font-bold text-amber-700">25%</span> из них оформят подписку, вы получите{' '}
              <span className="font-bold text-amber-700">+1 месяц подписки</span> в подарок.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Приглашено: <span className="font-semibold text-gray-900">{inviteCount}/50</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Конверсия: <span className="font-semibold text-gray-900">нужно 25%+</span></span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Приглашённые коллеги</h2>
        {invitedFriends.length > 0 ? (
          <div className="space-y-3">
            {invitedFriends.map((friend, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                  {friend.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{friend.name}</p>
                  <p className="text-xs text-gray-500">{friend.date}</p>
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  {friend.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-6">Пока никого не пригласили</p>
        )}
      </Card>
    </div>
  );
}
