import { toWorkdayIndex, weekKey } from "./dates";
import { canPersonTakeDay, rulesFromPerson } from "./person-rules";
import type { PersonDTO } from "./types";

export type SwapValidation =
  | { ok: true }
  | { ok: false; error: string };

type AssignmentLike = { personId: string; date: string };

/**
 * Validate swapping personA's dateA with personB's dateB.
 * After swap: A gets dateB, B gets dateA.
 */
export function validateSwap(
  personA: PersonDTO,
  personB: PersonDTO,
  dateA: string,
  dateB: string,
  allAssignments: AssignmentLike[],
  maxPerDay: number,
): SwapValidation {
  if (personA.id === personB.id) {
    return { ok: false, error: "Selecione duas pessoas diferentes." };
  }
  if (dateA === dateB) {
    return { ok: false, error: "Os dias precisam ser diferentes." };
  }

  const aHas = allAssignments.find((x) => x.personId === personA.id && x.date === dateA);
  const bHas = allAssignments.find((x) => x.personId === personB.id && x.date === dateB);
  if (!aHas) {
    return { ok: false, error: `${personA.name} não come pizza em ${dateA}.` };
  }
  if (!bHas) {
    return { ok: false, error: `${personB.name} não come pizza em ${dateB}.` };
  }

  const wdA = toWorkdayIndex(new Date(dateA + "T12:00:00"));
  const wdB = toWorkdayIndex(new Date(dateB + "T12:00:00"));
  if (wdA < 0 || wdB < 0) {
    return { ok: false, error: "Só é possível trocar dias úteis." };
  }

  const rulesA = rulesFromPerson(personA);
  const rulesB = rulesFromPerson(personB);
  if (!canPersonTakeDay(rulesA, dateB, wdB)) {
    return { ok: false, error: `${personA.name} não pode comer pizza em ${dateB} (restrição).` };
  }
  if (!canPersonTakeDay(rulesB, dateA, wdA)) {
    return { ok: false, error: `${personB.name} não pode comer pizza em ${dateA} (restrição).` };
  }

  // Simulate post-swap assignments
  const simulated = allAssignments
    .filter(
      (x) =>
        !(x.personId === personA.id && x.date === dateA) &&
        !(x.personId === personB.id && x.date === dateB),
    )
    .concat([
      { personId: personA.id, date: dateB },
      { personId: personB.id, date: dateA },
    ]);

  // Capacity: maxPerDay on dateA and dateB
  for (const day of [dateA, dateB]) {
    const count = simulated.filter((x) => x.date === day).length;
    if (count > maxPerDay) {
      return { ok: false, error: `O dia ${day} ficaria com ${count} pessoas (máx. ${maxPerDay}).` };
    }
  }

  // Each person still exactly 1 HO per week for affected weeks
  const weeks = new Set([weekKey(dateA), weekKey(dateB)]);
  for (const personId of [personA.id, personB.id]) {
    for (const wk of weeks) {
      const count = simulated.filter(
        (x) => x.personId === personId && weekKey(x.date) === wk,
      ).length;
      if (count !== 1) {
        const name = personId === personA.id ? personA.name : personB.name;
        return {
          ok: false,
          error: `${name} ficaria com ${count} dias de pizza na semana de ${wk} (precisa ser 1).`,
        };
      }
    }
  }

  return { ok: true };
}
