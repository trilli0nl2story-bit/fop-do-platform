import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'social_proof_count';
const BASE_COUNT = 347;

function getTimeOfDayMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 0.4;
  if (hour >= 9 && hour < 13) return 1.2;
  if (hour >= 13 && hour < 17) return 1.0;
  if (hour >= 17 && hour < 21) return 1.5;
  if (hour >= 21 && hour < 24) return 0.7;
  return 0.2;
}

function getIntervalMs(): number {
  const multiplier = getTimeOfDayMultiplier();
  const base = 40000;
  const adjusted = base / multiplier;
  const jitter = (Math.random() - 0.5) * 20000;
  return Math.max(15000, Math.min(70000, adjusted + jitter));
}

function getIncrement(): number {
  const r = Math.random();
  if (r < 0.6) return 1;
  if (r < 0.85) return 2;
  return 3;
}

function loadCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= BASE_COUNT) return parsed;
    }
  } catch {}
  return BASE_COUNT;
}

function saveCount(count: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch {}
}

export interface SocialProofState {
  count: number;
  animating: boolean;
  lastIncrement: number;
}

export function useSocialProof(): SocialProofState {
  const [state, setState] = useState<SocialProofState>(() => ({
    count: loadCount(),
    animating: false,
    lastIncrement: 1,
  }));

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const increment = getIncrement();
      setState(prev => {
        const next = prev.count + increment;
        saveCount(next);
        return { count: next, animating: true, lastIncrement: increment };
      });
      setTimeout(() => {
        setState(prev => ({ ...prev, animating: false }));
      }, 600);
      scheduleNext();
    }, getIntervalMs());
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  return state;
}
