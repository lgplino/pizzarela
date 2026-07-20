import type { Person } from "@prisma/client";
import type { PersonDTO, PersonRules } from "./types";

export function parseJsonArray(raw: string): number[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(Number) : [];
  } catch {
    return [];
  }
}

export function parseJsonStringArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function personToDTO(p: Person): PersonDTO {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    blockedWeekdays: parseJsonArray(p.blockedWeekdays),
    preferredWeekdays: parseJsonArray(p.preferredWeekdays),
    fixedWeekday: p.fixedWeekday,
    blockedDates: parseJsonStringArray(p.blockedDates),
    active: p.active,
    sortOrder: p.sortOrder,
  };
}

export function isPersonDTO(p: Person | PersonDTO): p is PersonDTO {
  return Array.isArray((p as PersonDTO).blockedWeekdays);
}

export function rulesFromPerson(p: Person | PersonDTO): PersonRules {
  if (isPersonDTO(p)) {
    return {
      blockedWeekdays: p.blockedWeekdays,
      preferredWeekdays: p.preferredWeekdays,
      fixedWeekday: p.fixedWeekday,
      blockedDates: p.blockedDates,
    };
  }
  return {
    blockedWeekdays: parseJsonArray(p.blockedWeekdays),
    preferredWeekdays: parseJsonArray(p.preferredWeekdays),
    fixedWeekday: p.fixedWeekday,
    blockedDates: parseJsonStringArray(p.blockedDates),
  };
}

export function hasAnyRestriction(p: PersonDTO): boolean {
  return (
    p.blockedWeekdays.length > 0 ||
    p.preferredWeekdays.length > 0 ||
    p.fixedWeekday != null ||
    p.blockedDates.length > 0
  );
}

export function canPersonTakeDay(
  rules: PersonRules,
  isoDate: string,
  workdayIndex: number,
): boolean {
  if (workdayIndex < 0) return false;
  if (rules.blockedWeekdays.includes(workdayIndex)) return false;
  if (rules.blockedDates?.includes(isoDate)) return false;
  if (rules.fixedWeekday != null && rules.fixedWeekday !== workdayIndex) return false;
  return true;
}
