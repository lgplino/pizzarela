import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/** Monday=0 … Friday=4 (plan convention). Weekend returns -1. */
export function toWorkdayIndex(date: Date): number {
  const iso = getISODay(date); // Mon=1 … Sun=7
  if (iso >= 6) return -1;
  return iso - 1;
}

export function monthKeyFromDate(date: Date): string {
  return format(date, "yyyy-MM");
}

export function monthKeyFromParts(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split("-").map(Number);
  return { year: y, month: m };
}

export function formatISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseISODate(iso: string): Date {
  return parseISO(iso);
}

export function weekKey(isoDate: string): string {
  const d = parseISO(isoDate);
  const start = startOfWeek(d, { weekStartsOn: 1 });
  return formatISODate(start);
}

export function getWorkdaysInMonth(monthKey: string, holidaySet: Set<string>): Date[] {
  const { year, month } = parseMonthKey(monthKey);
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).filter((d) => {
    const wd = toWorkdayIndex(d);
    if (wd < 0) return false;
    return !holidaySet.has(formatISODate(d));
  });
}

/** Groups workdays by ISO week start (Monday). */
export function groupWorkdaysByWeek(days: Date[]): Date[][] {
  const map = new Map<string, Date[]>();
  for (const d of days) {
    const key = formatISODate(startOfWeek(d, { weekStartsOn: 1 }));
    const list = map.get(key) ?? [];
    list.push(d);
    map.set(key, list);
  }
  return Array.from(map.values());
}

export function calendarWeeksForMonth(monthKey: string): Date[][] {
  const { year, month } = parseMonthKey(monthKey);
  const first = startOfMonth(new Date(year, month - 1, 1));
  const last = endOfMonth(first);
  let cursor = startOfWeek(first, { weekStartsOn: 1 });
  const end = startOfWeek(last, { weekStartsOn: 1 });
  const weeks: Date[][] = [];

  while (cursor <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 5; i++) {
      week.push(addDays(cursor, i));
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function isInMonth(date: Date, monthKey: string): boolean {
  const { year, month } = parseMonthKey(monthKey);
  return isSameMonth(date, new Date(year, month - 1, 1));
}

export function monthTitle(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(year, month - 1, 1);
  const name = format(d, "MMMM yyyy", { locale: ptBR });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;
export const WEEKDAY_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] as const;

export function todayISO(): string {
  return formatISODate(new Date());
}
