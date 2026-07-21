import {
  formatISODate,
  getWorkdaysInMonth,
  groupWorkdaysByWeek,
  toWorkdayIndex,
} from "./dates";
import { canPersonTakeDay, rulesFromPerson } from "./person-rules";
import type { GenerateResult, PersonDTO } from "./types";

type FairnessCounts = Map<string, number[]>; // personId -> count per weekday 0..4

/** Generation-only caps: Fri = 2, Mon–Thu = 1. Manual edits can still exceed. */
export function generationDayCap(workdayIndex: number): number {
  if (workdayIndex < 0) return 0;
  return workdayIndex === 4 ? 2 : 1;
}

function emptyCounts(): number[] {
  return [0, 0, 0, 0, 0];
}

function weekdayTotalsFromFairness(fairness: FairnessCounts): number[] {
  const totals = emptyCounts();
  for (const counts of fairness.values()) {
    for (let i = 0; i < 5; i++) totals[i] += counts[i];
  }
  return totals;
}

function scoreAssignment(
  person: PersonDTO,
  workdayIndex: number,
  fairness: FairnessCounts,
  dayFill: number,
  weekdayTotals: number[],
  dayCap: number,
): number {
  const counts = fairness.get(person.id) ?? emptyCounts();
  const fixedBonus = person.fixedWeekday === workdayIndex ? 1000 : 0;
  // Soft preference (Lucas/Lino → seg/qua/sex) — fairness must outweigh stacking
  const preferredBonus = person.preferredWeekdays.includes(workdayIndex) ? 70 : 0;
  const personalFairnessPenalty = counts[workdayIndex] * 50;
  const dayFillPenalty = dayFill * 40;
  const weekdayBalancePenalty = weekdayTotals[workdayIndex] * 8;
  // Attract people to Friday until 2 seats are filled (weaker than preference stack)
  const fridayFillBonus =
    workdayIndex === 4 && dayFill < dayCap ? (dayCap - dayFill) * 30 : 0;

  return (
    fixedBonus +
    preferredBonus +
    fridayFillBonus -
    personalFairnessPenalty -
    dayFillPenalty -
    weekdayBalancePenalty
  );
}

function totalHoCount(fairness: FairnessCounts, personId: string): number {
  return (fairness.get(personId) ?? emptyCounts()).reduce((a, b) => a + b, 0);
}

function weekCapacity(weekDays: Date[]): number {
  return weekDays.reduce((sum, d) => sum + generationDayCap(toWorkdayIndex(d)), 0);
}

/**
 * Greedy weekly scheduler with Pizzarela generation rules:
 * - 1 pizza/person/week when slots allow
 * - Mon–Thu: max 1 person (generation only)
 * - Friday: target/max 2 people
 * - respects preferences / fixed / blocked
 */
export function generateMonthSchedule(
  people: PersonDTO[],
  monthKey: string,
  holidayDates: string[],
  _maxPerDayIgnored?: number,
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

    const capacity = weekCapacity(weekDays);
    const isFullWeek = capacity >= active.length;

    const remaining = [...active].sort((a, b) => {
      const af = a.fixedWeekday != null ? 0 : 1;
      const bf = b.fixedWeekday != null ? 0 : 1;
      if (af !== bf) return af - bf;
      const ap = a.preferredWeekdays.length > 0 ? 0 : 1;
      const bp = b.preferredWeekdays.length > 0 ? 0 : 1;
      if (ap !== bp) return ap - bp;
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

      const weekdayTotals = weekdayTotalsFromFairness(fairness);

      const candidates = weekDays
        .map((d) => {
          const iso = formatISODate(d);
          const wd = toWorkdayIndex(d);
          const cap = generationDayCap(wd);
          const rules = rulesFromPerson(person);
          if (!canPersonTakeDay(rules, iso, wd)) return null;
          const fill = daySlots.get(iso) ?? 0;
          if (fill >= cap) return null;
          return {
            iso,
            wd,
            score: scoreAssignment(person, wd, fairness, fill, weekdayTotals, cap),
          };
        })
        .filter((c): c is { iso: string; wd: number; score: number } => c != null)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const wa = weekdayTotals[a.wd];
          const wb = weekdayTotals[b.wd];
          if (wa !== wb) return wa - wb;
          return b.wd - a.wd;
        });

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

    // If Friday exists and has < 2, try to pull someone still unassigned onto Friday
    const friday = weekDays.find((d) => toWorkdayIndex(d) === 4);
    if (friday) {
      const friIso = formatISODate(friday);
      while ((daySlots.get(friIso) ?? 0) < 2) {
        const candidate = remaining.find((p) => {
          if (assignedThisWeek.has(p.id)) return false;
          return canPersonTakeDay(rulesFromPerson(p), friIso, 4);
        });
        if (!candidate) break;
        assignments.push({ personId: candidate.id, date: friIso });
        daySlots.set(friIso, (daySlots.get(friIso) ?? 0) + 1);
        assignedThisWeek.add(candidate.id);
        const counts = fairness.get(candidate.id) ?? emptyCounts();
        counts[4] += 1;
        fairness.set(candidate.id, counts);
      }

      if ((daySlots.get(friIso) ?? 0) < 2 && weekDays.length >= 5) {
        conflicts.push(
          `Sexta ${friIso}: só ${daySlots.get(friIso) ?? 0} pessoa(s) (meta: 2)`,
        );
      }
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
