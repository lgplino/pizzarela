/** Shared seed roster + July kickoff schedule */

export type SeedPerson = {
  name: string;
  color: string;
  preferredWeekdays: number[]; // 0=Mon … 4=Fri
};

/** Seg / Qua / Sex */
export const PREFER_MON_WED_FRI = [0, 2, 4];

export const SEED_PEOPLE: SeedPerson[] = [
  { name: "Isa", color: "#E6392B", preferredWeekdays: [] },
  { name: "Bruno", color: "#2D6A4F", preferredWeekdays: [] },
  { name: "Jojo", color: "#F4A261", preferredWeekdays: [] },
  { name: "Rossi", color: "#457B9D", preferredWeekdays: PREFER_MON_WED_FRI },
  { name: "Lino", color: "#9B2226", preferredWeekdays: PREFER_MON_WED_FRI },
  { name: "Sala", color: "#6A994E", preferredWeekdays: [] },
  { name: "Grilo", color: "#CA8A04", preferredWeekdays: [] },
];

export const SEED_SCHEDULE: { date: string; names: string[] }[] = [
  { date: "2026-07-20", names: ["Rossi"] },
  { date: "2026-07-21", names: ["Sala", "Jojo"] },
  { date: "2026-07-22", names: [] },
  { date: "2026-07-23", names: ["Bruno"] },
  { date: "2026-07-24", names: ["Isa", "Lino"] },
  { date: "2026-07-27", names: ["Lino"] },
  { date: "2026-07-28", names: ["Isa"] },
  { date: "2026-07-29", names: ["Rossi"] },
  { date: "2026-07-30", names: ["Jojo"] },
  { date: "2026-07-31", names: ["Sala", "Bruno"] },
];
