export type AnalyticsEventType =
  | 'product_view'
  | 'preview_click'
  | 'add_to_cart_click'
  | 'buy_click'
  | 'subscription_click'
  | 'category_click'
  | 'search_query'
  | 'registration_start';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}

const STORAGE_KEY = 'cms_analytics_events';
const MAX_EVENTS = 500;

function loadEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

export function recordEvent(type: AnalyticsEventType, payload: Record<string, unknown> = {}): void {
  const events = loadEvents();
  const event: AnalyticsEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    timestamp: Date.now(),
  };
  const trimmed = [event, ...events].slice(0, MAX_EVENTS);
  saveEvents(trimmed);
}

export function getEvents(): AnalyticsEvent[] {
  return loadEvents();
}

export function getEventsByType(type: AnalyticsEventType): AnalyticsEvent[] {
  return loadEvents().filter(e => e.type === type);
}

export function getEventCounts(): Record<AnalyticsEventType, number> {
  const events = loadEvents();
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts as Record<AnalyticsEventType, number>;
}

export function clearEvents(): void {
  localStorage.removeItem(STORAGE_KEY);
}
