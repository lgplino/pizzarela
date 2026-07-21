"use client";

import type { PersonDTO } from "@/lib/types";
import { hasAnyRestriction } from "@/lib/person-rules";
import { PizzaSliceIcon } from "./PizzaIcons";
import type { EditMode } from "./MonthCalendar";

type Props = {
  people: PersonDTO[];
  selectedId: string | null;
  placePersonId: string | null;
  mode: EditMode;
  onSelectMe: (id: string | null) => void;
  onSelectPlace: (id: string) => void;
};

export function TeamLegend({
  people,
  selectedId,
  placePersonId,
  mode,
  onSelectMe,
  onSelectPlace,
}: Props) {
  return (
    <aside className="flex flex-col gap-3 rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow)] sm:gap-4 sm:p-4">
      <div>
        <label className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Eu sou
        </label>
        <select
          className="mt-1 w-full rounded-xl border-2 border-[var(--line)] bg-[var(--mozzarella)] px-3 py-2.5 text-sm font-bold sm:py-2"
          value={selectedId ?? ""}
          onChange={(e) => onSelectMe(e.target.value || null)}
        >
          <option value="">Todo mundo</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">
          <PizzaSliceIcon className="h-4 w-4" />
          Equipe
        </h2>
        {mode === "place" && (
          <p className="mt-1 text-xs font-semibold text-[var(--tomato)]">
            Escolha alguém e clique num dia vazio.
          </p>
        )}
        <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-1 sm:space-y-0">
          {people.map((p) => {
            const active = mode === "place" && placePersonId === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "place") onSelectPlace(p.id);
                    else onSelectMe(p.id === selectedId ? null : p.id);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold transition ${
                    active
                      ? "bg-[var(--tomato)] text-white shadow-md"
                      : selectedId === p.id
                        ? "bg-[var(--accent-soft)] ring-2 ring-[var(--tomato)]"
                        : "hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <PizzaSliceIcon
                    className="h-5 w-5 shrink-0"
                    color={active ? "#fff" : p.color}
                  />
                  <span className="flex-1 truncate">{p.name}</span>
                  {hasAnyRestriction(p) && !active && (
                    <span className="hidden text-[10px] font-semibold text-[var(--muted)] sm:inline">
                      regras
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
