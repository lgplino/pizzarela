"use client";

import {
  calendarWeeksForMonth,
  formatISODate,
  isInMonth,
  WEEKDAY_LABELS,
} from "@/lib/dates";
import type { AssignmentDTO, HolidayDTO, PersonDTO } from "@/lib/types";
import { OvenIcon, PizzaSliceIcon } from "./PizzaIcons";

export type EditMode = "view" | "place" | "swap";
type SwapPick = { personId: string; date: string } | null;

type Props = {
  monthKey: string;
  people: PersonDTO[];
  assignments: AssignmentDTO[];
  holidays: HolidayDTO[];
  today: string;
  highlightPersonId: string | null;
  mode: EditMode;
  placePersonId: string | null;
  swapPickA: SwapPick;
  swapPickB: SwapPick;
  onDayClick: (date: string) => void;
  onChipClick: (personId: string, date: string) => void;
  maxPerDay: number;
};

export function MonthCalendar({
  monthKey,
  people,
  assignments,
  holidays,
  today,
  highlightPersonId,
  mode,
  placePersonId,
  swapPickA,
  swapPickB,
  onDayClick,
  onChipClick,
  maxPerDay,
}: Props) {
  const weeks = calendarWeeksForMonth(monthKey);
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-[var(--tomato)]/30 bg-[var(--surface)] shadow-[var(--shadow)]">
      <div className="grid grid-cols-5 border-b-2 border-[var(--line)] bg-gradient-to-b from-[var(--tomato)] to-[var(--tomato-deep)]">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="divide-y divide-[var(--line)]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-5 divide-x divide-[var(--line)]">
            {week.map((day) => {
              const iso = formatISODate(day);
              const inMonth = isInMonth(day, monthKey);
              const isToday = iso === today;
              const holiday = holidayMap.get(iso);
              const dayAssignments = assignments.filter((a) => a.date === iso);
              const isWeekendLike = day.getDay() === 0 || day.getDay() === 6;
              const canPlace =
                mode === "place" &&
                inMonth &&
                !holiday &&
                !isWeekendLike &&
                dayAssignments.length < maxPerDay &&
                placePersonId;

              const cellClass = `min-h-[118px] p-2 text-left transition ${
                !inMonth ? "bg-[var(--wash)] opacity-40" : ""
              } ${isToday ? "bg-[var(--today-bg)] ring-2 ring-inset ring-[var(--tomato)]" : ""} ${
                holiday ? "bg-[var(--holiday-bg)]" : ""
              } ${canPlace ? "cursor-pointer hover:bg-[var(--accent-soft)]" : ""}`;

              return (
                <div
                  key={iso}
                  role={canPlace ? "button" : undefined}
                  tabIndex={canPlace ? 0 : undefined}
                  onClick={() => {
                    if (canPlace) onDayClick(iso);
                  }}
                  onKeyDown={(e) => {
                    if (canPlace && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onDayClick(iso);
                    }
                  }}
                  className={cellClass}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${
                        isToday
                          ? "bg-[var(--tomato)] text-white"
                          : "text-[var(--ink)]"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {holiday && (
                      <span className="truncate text-[10px] font-semibold text-[var(--basil)]" title={holiday}>
                        {holiday}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {dayAssignments.length === 0 && inMonth && !holiday && !isWeekendLike && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)]/70">
                        <OvenIcon className="h-3.5 w-3.5 opacity-60" />
                        forno frio
                      </span>
                    )}
                    {dayAssignments.map((a) => {
                      const person = peopleById.get(a.personId);
                      if (!person) return null;
                      const picked =
                        (swapPickA?.personId === a.personId && swapPickA.date === iso) ||
                        (swapPickB?.personId === a.personId && swapPickB.date === iso);
                      const dimmed =
                        highlightPersonId && highlightPersonId !== a.personId && mode === "view";

                      return (
                        <span
                          key={a.id}
                          role={mode !== "view" ? "button" : undefined}
                          tabIndex={mode !== "view" ? 0 : undefined}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (mode !== "view") onChipClick(a.personId, iso);
                          }}
                          onKeyDown={(e) => {
                            if (mode !== "view" && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              onChipClick(a.personId, iso);
                            }
                          }}
                          className={`flex items-center gap-1 rounded-full px-1.5 py-1 text-left text-xs font-bold transition ${
                            mode !== "view" ? "cursor-pointer hover:brightness-95" : ""
                          } ${picked ? "ring-2 ring-[var(--tomato)] ring-offset-1" : ""} ${
                            dimmed ? "opacity-30" : ""
                          }`}
                          style={{
                            backgroundColor: `${person.color}28`,
                            color: person.color,
                          }}
                        >
                          <PizzaSliceIcon className="h-3.5 w-3.5 shrink-0" color={person.color} />
                          <span className="truncate">{person.name}</span>
                          {mode === "place" && (
                            <span className="ml-auto text-[10px] opacity-70">×</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
