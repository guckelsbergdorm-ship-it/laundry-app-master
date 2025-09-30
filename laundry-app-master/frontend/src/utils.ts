const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchWithCredentials(url: string, options?: RequestInit & { timeout?: number }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeout ?? 5000);
  const fullUrl = API_BASE_URL ? `${API_BASE_URL}${url}` : url;
  try {
    return await fetch(fullUrl, {
      credentials: 'include',
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJsonWithCredentialsOrThrow<T>(url: string, options?: RequestInit) {
  const res = await fetchWithCredentials(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed with status ${res.status}: ${text}`);
  }
  return await (await res.json() as Promise<T>);
}

export default function isSameDay(date1: Date, date2: Date) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

export function formatDateRelativeToToday(date: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, tomorrow)) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString("de-DE");
  }
}

export function prettifyWeekday(date: Date) {
  if (isSameDay(date, new Date())) {
    return "Today";
  }
  if (isSameDay(date, new Date(Date.now() + 24 * 60 * 60 * 1000))) {
    return "Tomorrow";
  }
  if (isSameDay(date, new Date(Date.now() - 24 * 60 * 60 * 1000))) {
    return "Yesterday";
  }
  switch (date.getDay()) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
  }
  return "?";
}

export function toLocalDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export function camelToTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}
