"use client";

import { useCallback, useEffect, useState } from "react";
import { addMonths, format } from "date-fns";
import { monthKeyFromDate, monthTitle, parseMonthKey } from "@/lib/dates";
import type { MonthData } from "@/lib/types";
import { MonthCalendar, type EditMode } from "./MonthCalendar";
import { BasilIcon, CheckeredBg, PizzaIcon, PizzaSliceIcon } from "./PizzaIcons";
import { SwapPanel } from "./SwapPanel";
import { TeamLegend } from "./TeamLegend";

type SwapPick = { personId: string; date: string } | null;

const ME_KEY = "pizzarela-me";

export function HomeApp() {
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(new Date()));
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditMode>("view");
  const [placePersonId, setPlacePersonId] = useState<string | null>(null);
  const [swapPickA, setSwapPickA] = useState<SwapPick>(null);
  const [swapPickB, setSwapPickB] = useState<SwapPick>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/month?month=${key}`);
      const json = (await res.json()) as MonthData;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(ME_KEY);
    if (stored) setMeId(stored);
  }, []);

  useEffect(() => {
    void load(monthKey);
  }, [monthKey, load]);

  function selectMe(id: string | null) {
    setMeId(id);
    if (id) localStorage.setItem(ME_KEY, id);
    else localStorage.removeItem(ME_KEY);
  }

  function shiftMonth(delta: number) {
    const { year, month } = parseMonthKey(monthKey);
    const next = addMonths(new Date(year, month - 1, 1), delta);
    setMonthKey(format(next, "yyyy-MM"));
  }

  function setEditMode(next: EditMode) {
    setMode(next);
    setSwapPickA(null);
    setSwapPickB(null);
    setError(null);
    setToast(null);
    if (next === "place") {
      setPlacePersonId((prev) => prev ?? meId ?? data?.people[0]?.id ?? null);
    }
  }

  async function placeOnDay(date: string) {
    if (!placePersonId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: placePersonId, date }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Não deu pra colocar a pizza");
        return;
      }
      setToast("Pizza no forno!");
      await load(monthKey);
    } finally {
      setBusy(false);
    }
  }

  async function removeFromDay(personId: string, date: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, date }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Não deu pra tirar");
        return;
      }
      setToast("Fatia removida.");
      await load(monthKey);
    } finally {
      setBusy(false);
    }
  }

  function onChipClick(personId: string, date: string) {
    if (mode === "place") {
      void removeFromDay(personId, date);
      return;
    }
    if (mode !== "swap") return;

    const pick = { personId, date };
    if (!swapPickA) {
      setSwapPickA(pick);
      return;
    }
    if (swapPickA.personId === personId && swapPickA.date === date) {
      setSwapPickA(null);
      return;
    }
    if (!swapPickB) {
      setSwapPickB(pick);
      return;
    }
    setSwapPickA(pick);
    setSwapPickB(null);
  }

  async function confirmSwap() {
    if (!swapPickA || !swapPickB) return;
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personAId: swapPickA.personId,
          personBId: swapPickB.personId,
          dateA: swapPickA.date,
          dateB: swapPickB.date,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Troca não rolou");
        return;
      }
      setToast(json.message);
      setSwapPickA(null);
      setSwapPickB(null);
      await load(monthKey);
    } finally {
      setBusy(false);
    }
  }

  async function undoSwap() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/swap", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Não deu pra desfazer");
        return;
      }
      setToast("Última troca desfeita.");
      await load(monthKey);
    } finally {
      setBusy(false);
    }
  }

  const todayPeople =
    data?.assignments
      .filter((a) => a.date === data.today)
      .map((a) => data.people.find((p) => p.id === a.personId)?.name)
      .filter(Boolean) ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CheckeredBg />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-[var(--blob-a)] blur-3xl" />
        <div className="absolute -right-10 top-48 h-80 w-80 rounded-full bg-[var(--blob-b)] blur-3xl" />
      </div>

      <header className="mx-auto max-w-6xl px-4 pb-2 pt-8 sm:px-6 sm:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="animate-float-slice">
              <PizzaIcon className="h-16 w-16 drop-shadow-lg sm:h-20 sm:w-20" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl leading-none text-[var(--tomato)] sm:text-6xl">
                Pizzarela
              </p>
              <p className="mt-2 max-w-sm text-sm font-semibold text-[var(--muted)]">
                O cardápio de quem come pizza em casa. Todo mundo pode mexer —
                1 fatia por semana, até 2 na mesma mesa.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-extrabold text-[var(--basil)]">
                <BasilIcon className="h-4 w-4" />
                fresco · justo · com mussarela
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end rounded-full border-2 border-[var(--line)] bg-[var(--surface)] p-1 shadow-[var(--shadow)]">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-full px-3 py-2 text-sm font-extrabold hover:bg-[var(--surface-2)]"
              aria-label="Mês anterior"
            >
              ←
            </button>
            <h1 className="min-w-[9.5rem] text-center font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              {monthTitle(monthKey)}
            </h1>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-full px-3 py-2 text-sm font-extrabold hover:bg-[var(--surface-2)]"
              aria-label="Próximo mês"
            >
              →
            </button>
          </div>
        </div>

        {todayPeople.length > 0 ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-[var(--tomato)]/40 bg-[var(--today-bg)] px-4 py-3">
            <PizzaSliceIcon className="h-8 w-8 animate-sizzle" />
            <p className="text-sm font-bold text-[var(--ink)]">
              Hoje comendo pizza:{" "}
              <span className="text-[var(--tomato)]">{todayPeople.join(" · ")}</span>
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)]/80 px-4 py-3 text-sm font-semibold text-[var(--muted)]">
            Hoje o forno tá frio — ninguém na pizza.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["view", "Ver cardápio"],
              ["place", "Colocar / tirar"],
              ["swap", "Trocar fatias"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setEditMode(id)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                mode === id
                  ? "bg-[var(--tomato)] text-white shadow-md"
                  : "bg-[var(--surface)] text-[var(--ink)] ring-2 ring-[var(--line)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {(toast || error) && (
          <p
            className={`mt-3 text-sm font-extrabold ${
              error ? "text-[var(--tomato-deep)]" : "text-[var(--basil)]"
            }`}
          >
            {error ?? toast}
          </p>
        )}
        {busy && (
          <p className="mt-1 text-xs font-bold text-[var(--muted)]">Esquentando o forno…</p>
        )}
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 pt-4 sm:px-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-4">
          {data && (
            <TeamLegend
              people={data.people}
              selectedId={meId}
              placePersonId={placePersonId}
              mode={mode}
              onSelectMe={selectMe}
              onSelectPlace={setPlacePersonId}
            />
          )}
        </div>

        <div className="space-y-4">
          {loading && !data ? (
            <p className="text-sm font-bold text-[var(--muted)]">Abrindo a pizzaria…</p>
          ) : data ? (
            <MonthCalendar
              monthKey={monthKey}
              people={data.people}
              assignments={data.assignments}
              holidays={data.holidays}
              today={data.today}
              highlightPersonId={meId}
              mode={mode}
              placePersonId={placePersonId}
              swapPickA={swapPickA}
              swapPickB={swapPickB}
              onDayClick={placeOnDay}
              onChipClick={onChipClick}
              maxPerDay={data.maxPerDay}
            />
          ) : null}

          {mode === "swap" && data && (
            <SwapPanel
              people={data.people}
              swaps={data.swaps}
              swapPickA={swapPickA}
              swapPickB={swapPickB}
              onConfirmSwap={confirmSwap}
              onCancelSwap={() => {
                setSwapPickA(null);
                setSwapPickB(null);
              }}
              onUndoSwap={undoSwap}
              busy={busy}
              message={toast}
              error={error}
            />
          )}

          {mode === "place" && (
            <p className="rounded-2xl bg-[var(--surface)]/90 px-4 py-3 text-sm font-semibold text-[var(--muted)] ring-2 ring-[var(--line)]">
              <strong className="text-[var(--tomato)]">Dica:</strong> escolher a pessoa na
              lateral, clicar no dia pra colocar. Clicar numa fatia existente remove.
              Se a pessoa já tinha pizza na semana, a fatia antiga sai sozinha.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
