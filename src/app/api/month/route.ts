import { NextResponse } from "next/server";
import { ensureSettings } from "@/lib/auth";
import { monthKeyFromDate, todayISO } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { personToDTO } from "@/lib/person-rules";
import type { MonthData } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthKey = searchParams.get("month") ?? monthKeyFromDate(new Date());

  await ensureSettings();

  const [people, assignments, holidays, swaps, settings] = await Promise.all([
    prisma.person.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.assignment.findMany({ where: { monthKey } }),
    prisma.holiday.findMany({ orderBy: { date: "asc" } }),
    prisma.swapLog.findMany({
      where: { undone: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  const data: MonthData = {
    monthKey,
    people: people.map(personToDTO),
    assignments: assignments.map((a) => ({
      id: a.id,
      personId: a.personId,
      date: a.date,
      monthKey: a.monthKey,
    })),
    holidays: holidays.map((h) => ({ id: h.id, date: h.date, name: h.name })),
    swaps: swaps.map((s) => ({
      id: s.id,
      personAId: s.personAId,
      personBId: s.personBId,
      dateABefore: s.dateABefore,
      dateBBefore: s.dateBBefore,
      createdAt: s.createdAt.toISOString(),
      undone: s.undone,
    })),
    maxPerDay: settings?.maxPerDay ?? 2,
    today: todayISO(),
  };

  return NextResponse.json(data);
}
