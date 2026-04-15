import { useEffect, useState, useRef } from 'react';
import { getContextHint } from '../data/notifications';
import { Lightbulb } from 'lucide-react';

interface ContextHintProps {
  context: string;
}

export function ContextHint({ context }: ContextHintProps) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState(() => getContextHint(context));
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHint(getContextHint(context));
    setVisible(false);

    showTimer.current = setTimeout(() => {
      setVisible(true);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
      }, 6000);
    }, 2000);

    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [context]);

  return (
    <div
      className={`transition-all duration-500 overflow-hidden ${
        visible ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0'
      }`}
    >
      <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 mt-2">
        <Lightbulb className="w-3 h-3 flex-shrink-0" />
        {hint}
      </div>
    </div>
  );
}
