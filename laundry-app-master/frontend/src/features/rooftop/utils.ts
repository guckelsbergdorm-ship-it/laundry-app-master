export function isDayInPast(day: number, monthIndex: number, year: number): boolean {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(year, monthIndex, day);
  return dateToCheck < todayStart;
}

export function isDaySame(day: number, monthIndex: number, year: number, other: Date): boolean {
  return day === other.getDate() && monthIndex === other.getMonth() && year === other.getFullYear();
}

export function isDayToday(day: number, monthIndex: number, year: number): boolean {
  const today = new Date();
  return day === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear();
}

