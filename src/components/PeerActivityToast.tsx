import { useEffect, useState, useRef } from 'react';
import { NAMES, CITIES, MATERIAL_ACTIONS, randomItem } from '../data/notifications';

interface PeerActivityToastProps {
  context?: string;
}

const CONTEXT_ACTIONS: Record<string, string[]> = {
  ktp: ['скачала КТП на апрель', 'скачала КТП на неделю', 'купила КТП для средней группы'],
  diagnostics: ['скачала диагностику 4–5 лет', 'купила диагностическую карту', 'скачала диагностику на конец года'],
  games: ['скачала квест для детей', 'купила сценарий досуга', 'скачала игровые материалы'],
  parents: ['скачала план родительского собрания', 'купила сценарий собрания'],
  events: ['скачала сценарий праздника', 'купила досуговое мероприятие'],
  program: ['скачала рабочую программу', 'купила программу по ФОП ДО'],
  default: MATERIAL_ACTIONS,
};

export function PeerActivityToast({ context = 'default' }: PeerActivityToastProps) {
  const [toast, setToast] = useState<{ name: string; city: string; action: string } | null>(null);
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const actions = CONTEXT_ACTIONS[context] ?? CONTEXT_ACTIONS.default;

    const schedule = () => {
      const delay = 40000 + Math.random() * 20000;
      timerRef.current = setTimeout(() => {
        setToast({
          name: randomItem(NAMES),
          city: randomItem(CITIES),
          action: randomItem(actions),
        });
        setShow(true);
        setTimeout(() => {
          setShow(false);
          setTimeout(schedule, 1000);
        }, 4000);
      }, delay);
    };

    const initial = 8000 + Math.random() * 7000;
    timerRef.current = setTimeout(() => {
      setToast({
        name: randomItem(NAMES),
        city: randomItem(CITIES),
        action: randomItem(actions),
      });
      setShow(true);
      setTimeout(() => {
        setShow(false);
        setTimeout(schedule, 1000);
      }, 4000);
    }, initial);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [context]);

  if (!toast) return null;

  return (
    <div
      className={`flex items-center gap-2 text-xs text-gray-500 transition-all duration-500 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
      <span>
        <span className="font-medium text-gray-700">{toast.name}</span>
        {', '}
        {toast.city}
        {' — '}
        {toast.action}
      </span>
    </div>
  );
}
