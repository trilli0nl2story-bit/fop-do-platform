import { useEffect, useState, useRef } from 'react';
import { buildCornerToast, CornerToast } from '../data/notifications';

function getInterval(): number {
  return 45000 + Math.random() * 30000;
}

export function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<CornerToast>(() => buildCornerToast());
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      showTimer.current = setTimeout(() => {
        setToast(buildCornerToast());
        setVisible(true);
        hideTimer.current = setTimeout(() => {
          setVisible(false);
          schedule();
        }, 4000);
      }, getInterval());
    };

    schedule();

    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div
      className={`sm:hidden fixed bottom-5 left-4 right-4 z-40 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-xl rounded-2xl px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 text-sm font-bold select-none">
          {toast.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">{toast.name} из {toast.city}</p>
          <p className="text-sm text-gray-800 font-medium leading-snug">{toast.action}</p>
        </div>
      </div>
    </div>
  );
}
