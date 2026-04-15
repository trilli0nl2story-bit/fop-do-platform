import { useEffect, useState, useRef } from 'react';
import { getDocActivityMessage } from '../data/notifications';

interface DocumentActivityBadgeProps {
  context: string;
  downloadCount?: number;
  className?: string;
}

function getInterval(): number {
  return 20000 + Math.random() * 20000;
}

export function DocumentActivityBadge({ context, downloadCount, className = '' }: DocumentActivityBadgeProps) {
  const [currentMsg, setCurrentMsg] = useState(() => getDocActivityMessage(context));
  const [fading, setFading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      timer.current = setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setCurrentMsg(getDocActivityMessage(context));
          setFading(false);
          cycle();
        }, 500);
      }, getInterval());
    };

    cycle();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [context]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start gap-2.5 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1 animate-pulse" />
        <span
          className={`text-sm text-gray-700 leading-snug transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
        >
          {currentMsg}
        </span>
      </div>
      {downloadCount !== undefined && (
        <p className="text-xs text-gray-500 px-1">
          Этот материал уже скачали{' '}
          <span className="font-semibold text-gray-700">{downloadCount} педагогов</span>
        </p>
      )}
    </div>
  );
}
