export type PersonRules = {
  blockedWeekdays: number[];
  preferredWeekdays: number[];
  fixedWeekday?: number | null;
  blockedDates?: string[];
};

export type PersonDTO = {
  id: string;
  name: string;
  color: string;
  blockedWeekdays: number[];
  preferredWeekdays: number[];
  fixedWeekday: number | null;
  blockedDates: string[];
  active: boolean;
  sortOrder: number;
};

export type AssignmentDTO = {
  id: string;
  personId: string;
  date: string;
  monthKey: string;
};

export type HolidayDTO = {
  id: string;
  date: string;
  name: string;
};

export type SwapLogDTO = {
  id: string;
  personAId: string;
  personBId: string;
  dateABefore: string;
  dateBBefore: string;
  createdAt: string;
  undone: boolean;
};

export type MonthData = {
  monthKey: string;
  people: PersonDTO[];
  assignments: AssignmentDTO[];
  holidays: HolidayDTO[];
  swaps: SwapLogDTO[];
  maxPerDay: number;
  today: string;
};

export type GenerateResult = {
  ok: boolean;
  assignments: { personId: string; date: string }[];
  conflicts: string[];
};
