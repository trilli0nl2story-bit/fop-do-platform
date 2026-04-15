import { useEffect, useState, useRef } from 'react';
import { buildHeroLine, randomItem } from '../data/notifications';

const PREFIXES = ['Только что:', 'Сейчас:', 'Только что:'];
const TRENDING = [
  'Чаще всего сейчас выбирают: КТП на неделю',
  'Чаще всего сейчас выбирают: диагностика 4–5 лет',
  'Чаще всего сейчас выбирают: конспект занятия',
];

function getInterval(): number {
  return 12000 + Math.random() * 8000;
}

function buildLine(): string {
  if (Math.random() < 0.25) return randomItem(TRENDING);
  const prefix = randomItem(PREFIXES);
  return `${prefix} ${buildHeroLine()}`;
}

export function HeroNotification() {
  const [currentLine, setCurrentLine] = useState(() => buildLine());
  const [nextLine, setNextLine] = useState('');
  const [fading, setFading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      timer.current = setTimeout(() => {
        const next = buildLine();
        setNextLine(next);
        setFading(true);
        setTimeout(() => {
          setCurrentLine(next);
          setNextLine('');
          setFading(false);
          cycle();
        }, 600);
      }, getInterval());
    };

    cycle();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return (
    <div className="relative h-9 flex items-center justify-center w-full max-w-xl mx-auto">
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
          <span className="text-sm text-gray-700 font-medium whitespace-nowrap">{currentLine}</span>
        </div>
      </div>
      {nextLine && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium whitespace-nowrap">{nextLine}</span>
          </div>
        </div>
      )}
    </div>
  );
}
