import {
  formatISODate,
  getWorkdaysInMonth,
  groupWorkdaysByWeek,
  toWorkdayIndex,
} from "./dates";
import { canPersonTakeDay, rulesFromPerson } from "./person-rules";
import type { GenerateResult, PersonDTO } from "./types";

type FairnessCounts = Map<string, number[]>; // personId -> count per weekday 0..4

function emptyCounts(): number[] {
  return [0, 0, 0, 0, 0];
}

function scoreAssignment(
  person: PersonDTO,
  workdayIndex: number,
  fairness: FairnessCounts,
): number {
  const counts = fairness.get(person.id) ?? emptyCounts();
  const fairnessPenalty = counts[workdayIndex] * 10;
  const preferredBonus = person.preferredWeekdays.includes(workdayIndex) ? 5 : 0;
  const fixedBonus = person.fixedWeekday === workdayIndex ? 100 : 0;
  return fixedBonus + preferredBonus - fairnessPenalty;
}

function totalHoCount(fairness: FairnessCounts, personId: string): number {
  return (fairness.get(personId) ?? emptyCounts()).reduce((a, b) => a + b, 0);
}

/**
 * Greedy weekly scheduler:
 * - exactly 1 HO/person/week when the week has enough slots
 * - partial weeks (month edges): fill available slots fairly, no false conflicts
 * - max `maxPerDay` people per day
 * - respects hard constraints; reports conflicts when a full week is insolvable
 */
export function generateMonthSchedule(
  people: PersonDTO[],
  monthKey: string,
  holidayDates: string[],
  maxPerDay: number,
  priorFairness?: FairnessCounts,
): GenerateResult {
  const active = people.filter((p) => p.active);
  const holidaySet = new Set(holidayDates);
  const workdays = getWorkdaysInMonth(monthKey, holidaySet);
  const weeks = groupWorkdaysByWeek(workdays);

  const fairness: FairnessCounts = new Map();
  for (const p of active) {
    fairness.set(p.id, [...(priorFairness?.get(p.id) ?? emptyCounts())]);
  }

  const assignments: { personId: string; date: string }[] = [];
  const conflicts: string[] = [];

  for (const weekDays of weeks) {
    const daySlots = new Map<string, number>();
    for (const d of weekDays) {
      daySlots.set(formatISODate(d), 0);
    }

    const capacity = weekDays.length * maxPerDay;
    const isFullWeek = capacity >= active.length;

    // People with fewer HO so far get priority on short weeks
    const remaining = [...active].sort((a, b) => {
      const af = a.fixedWeekday != null ? 0 : 1;
      const bf = b.fixedWeekday != null ? 0 : 1;
      if (af !== bf) return af - bf;
      const ar = a.blockedWeekdays.length + a.blockedDates.length;
      const br = b.blockedWeekdays.length + b.blockedDates.length;
      if (br !== ar) return br - ar;
      return totalHoCount(fairness, a.id) - totalHoCount(fairness, b.id);
    });

    const assignedThisWeek = new Set<string>();
    let slotsUsed = 0;

    for (const person of remaining) {
      if (assignedThisWeek.has(person.id)) continue;
      if (slotsUsed >= capacity) break;

      const candidates = weekDays
        .map((d) => {
          const iso = formatISODate(d);
          const wd = toWorkdayIndex(d);
          const rules = rulesFromPerson(person);
          if (!canPersonTakeDay(rules, iso, wd)) return null;
          if ((daySlots.get(iso) ?? 0) >= maxPerDay) return null;
          return { iso, wd, score: scoreAssignment(person, wd, fairness) };
        })
        .filter((c): c is { iso: string; wd: number; score: number } => c != null)
        .sort((a, b) => b.score - a.score);

      if (candidates.length === 0) {
        if (isFullWeek || person.fixedWeekday != null) {
          conflicts.push(
            `${person.name}: sem dia de pizza na semana de ${formatISODate(weekDays[0])}`,
          );
        }
        continue;
      }

      const pick = candidates[0];
      assignments.push({ personId: person.id, date: pick.iso });
      daySlots.set(pick.iso, (daySlots.get(pick.iso) ?? 0) + 1);
      assignedThisWeek.add(person.id);
      slotsUsed += 1;
      const counts = fairness.get(person.id) ?? emptyCounts();
      counts[pick.wd] += 1;
      fairness.set(person.id, counts);
    }

    if (isFullWeek) {
      for (const person of active) {
        if (!assignedThisWeek.has(person.id)) {
          const already = conflicts.some((c) => c.startsWith(`${person.name}:`));
          if (!already) {
              conflicts.push(
              `${person.name}: sem dia de pizza na semana de ${formatISODate(weekDays[0])}`,
            );
          }
        }
      }
    }
  }

  return {
    ok: conflicts.length === 0,
    assignments,
    conflicts,
  };
}

export function buildFairnessFromAssignments(
  people: PersonDTO[],
  assignments: { personId: string; date: string }[],
): FairnessCounts {
  const fairness: FairnessCounts = new Map();
  for (const p of people) {
    fairness.set(p.id, emptyCounts());
  }
  for (const a of assignments) {
    const d = new Date(a.date + "T12:00:00");
    const wd = toWorkdayIndex(d);
    if (wd < 0) continue;
    const counts = fairness.get(a.personId) ?? emptyCounts();
    counts[wd] += 1;
    fairness.set(a.personId, counts);
  }
  return fairness;
}
