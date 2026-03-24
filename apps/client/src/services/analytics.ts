type EventPayload = Record<string, string | number | boolean | null | undefined>;

const STORAGE_KEY = 'korea-habit-analytics-v1';
const MAX_EVENTS = 200;

export function track(event: string, payload: EventPayload = {}): void {
  const item = {
    event,
    payload,
    at: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.info('[analytics]', item);
  }

  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const events = raw ? (JSON.parse(raw) as Array<typeof item>) : [];
    events.push(item);
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore analytics write errors
  }
}
