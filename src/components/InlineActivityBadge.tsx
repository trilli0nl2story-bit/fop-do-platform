import { useEffect, useState, useRef } from 'react';
import { randomItem, buildCornerToast } from '../data/notifications';

const INTERNAL_MESSAGES = [
  () => { const t = buildCornerToast(); return `Только что скачали: ${t.action.replace('скачала ', '').replace('получила ', '').replace('оформила ', '').replace('добавила ', '')}`; },
  () => 'Сейчас чаще выбирают: диагностика 4–5 лет',
  () => 'С этим материалом часто берут: КТП на следующий месяц',
  () => 'Сейчас чаще выбирают: конспект занятия',
  () => { const t = buildCornerToast(); return `${t.name} из ${t.city} только что оформила подписку`; },
  () => 'С этим материалом часто берут: годовой план',
  () => 'Сейчас чаще выбирают: КТП на неделю',
];

function getInterval(): number {
  return 18000 + Math.random() * 12000;
}

interface InlineActivityBadgeProps {
  className?: string;
}

export function InlineActivityBadge({ className = '' }: InlineActivityBadgeProps) {
  const [currentMsg, setCurrentMsg] = useState(() => randomItem(INTERNAL_MESSAGES)());
  const [fading, setFading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      timer.current = setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setCurrentMsg(randomItem(INTERNAL_MESSAGES)());
          setFading(false);
          cycle();
        }, 500);
      }, getInterval());
    };

    cycle();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
      <span
        className={`text-sm text-gray-600 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        {currentMsg}
      </span>
    </div>
  );
}
