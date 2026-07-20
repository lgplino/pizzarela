"use client";

import type { PersonDTO, SwapLogDTO } from "@/lib/types";
import { PizzaIcon } from "./PizzaIcons";

type SwapPick = { personId: string; date: string } | null;

type Props = {
  people: PersonDTO[];
  swaps: SwapLogDTO[];
  swapPickA: SwapPick;
  swapPickB: SwapPick;
  onConfirmSwap: () => void;
  onCancelSwap: () => void;
  onUndoSwap: () => void;
  busy: boolean;
  message: string | null;
  error: string | null;
};

export function SwapPanel({
  people,
  swaps,
  swapPickA,
  swapPickB,
  onConfirmSwap,
  onCancelSwap,
  onUndoSwap,
  busy,
  message,
  error,
}: Props) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const nameA = swapPickA ? byId.get(swapPickA.personId)?.name : null;
  const nameB = swapPickB ? byId.get(swapPickB.personId)?.name : null;

  return (
    <section className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center gap-2">
        <PizzaIcon className="h-7 w-7 animate-sizzle" />
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--tomato)]">
          Trocar fatias
        </h2>
      </div>

      <div className="mt-3 space-y-2 text-sm font-semibold text-[var(--muted)]">
        <p>Toque em duas fatias no calendário para trocar os dias.</p>
        <p className={nameA ? "text-[var(--ink)]" : ""}>
          {nameA && swapPickA
            ? `1. ${nameA} · ${formatBr(swapPickA.date)}`
            : "1. Primeira fatia…"}
        </p>
        <p className={nameB ? "text-[var(--ink)]" : ""}>
          {nameB && swapPickB
            ? `2. ${nameB} · ${formatBr(swapPickB.date)}`
            : "2. Segunda fatia…"}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={!swapPickA || !swapPickB || busy}
            onClick={onConfirmSwap}
            className="rounded-full bg-[var(--tomato)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Confirmar troca
          </button>
          <button
            type="button"
            onClick={onCancelSwap}
            className="rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm font-bold"
          >
            Limpar
          </button>
        </div>
      </div>

      {message && <p className="mt-2 text-sm font-bold text-[var(--basil)]">{message}</p>}
      {error && <p className="mt-2 text-sm font-bold text-[var(--tomato-deep)]">{error}</p>}

      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">
          Histórico
        </h3>
        <button
          type="button"
          onClick={onUndoSwap}
          disabled={busy || swaps.length === 0}
          className="text-xs font-extrabold text-[var(--tomato)] disabled:opacity-40"
        >
          Desfazer última
        </button>
      </div>
      <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs font-semibold text-[var(--muted)]">
        {swaps.length === 0 && <li>Nenhuma troca ainda — tudo no forno original.</li>}
        {swaps.map((s) => {
          const a = byId.get(s.personAId)?.name ?? "?";
          const b = byId.get(s.personBId)?.name ?? "?";
          return (
            <li key={s.id}>
              {a} ({formatBr(s.dateABefore)}) ↔ {b} ({formatBr(s.dateBBefore)})
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatBr(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
