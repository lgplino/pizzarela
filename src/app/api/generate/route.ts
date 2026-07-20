import { NextResponse } from "next/server";
import { monthKeyFromDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { personToDTO } from "@/lib/person-rules";
import { generateMonthSchedule } from "@/lib/scheduler";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const monthKey = String(body.monthKey ?? monthKeyFromDate(new Date()));

  const [people, holidays, settings] = await Promise.all([
    prisma.person.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.holiday.findMany(),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  const maxPerDay = settings?.maxPerDay ?? 2;
  const result = generateMonthSchedule(
    people.map(personToDTO),
    monthKey,
    holidays.map((h) => h.date),
    maxPerDay,
  );

  await prisma.$transaction([
    prisma.assignment.deleteMany({ where: { monthKey } }),
    prisma.assignment.createMany({
      data: result.assignments.map((a) => ({
        personId: a.personId,
        date: a.date,
        monthKey,
      })),
    }),
  ]);

  return NextResponse.json({
    ok: result.ok,
    conflicts: result.conflicts,
    count: result.assignments.length,
  });
}
