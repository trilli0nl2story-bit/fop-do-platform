import { useEffect, useState, useRef } from 'react';
import { randomItem } from '../data/notifications';

interface InlineActivityHintProps {
  messages: string[];
  intervalMs?: number;
  intervalJitterMs?: number;
  className?: string;
}

export function InlineActivityHint({
  messages,
  intervalMs = 20000,
  intervalJitterMs = 5000,
  className = '',
}: InlineActivityHintProps) {
  const [current, setCurrent] = useState(() => randomItem(messages));
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      const delay = intervalMs + Math.random() * intervalJitterMs;
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrent(randomItem(messages));
          setVisible(true);
          schedule();
        }, 350);
      }, delay);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [messages, intervalMs, intervalJitterMs]);

  return (
    <span
      className={`block transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ minHeight: '1.25rem' }}
    >
      {current}
    </span>
  );
}
