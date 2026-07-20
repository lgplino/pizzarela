import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const PEOPLE = [
  { name: "Isa", color: "#E6392B" },
  { name: "Bruno", color: "#2D6A4F" },
  { name: "Jojo", color: "#F4A261" },
  { name: "Rossi", color: "#457B9D" },
  { name: "Lino", color: "#9B2226" },
  { name: "Sala", color: "#6A994E" },
];

const SCHEDULE: { date: string; names: string[] }[] = [
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

/**
 * POST /api/seed?force=1
 * Header: x-seed-secret: <SEED_SECRET>
 * Popula pessoas + cronograma das duas semanas.
 */
export async function POST(request: Request) {
  const secret = process.env.SEED_SECRET ?? "pizzarela-seed";
  const provided =
    request.headers.get("x-seed-secret") ??
    new URL(request.url).searchParams.get("secret");

  if (provided !== secret) {
    return NextResponse.json({ error: "Secret inválido." }, { status: 401 });
  }

  const force = new URL(request.url).searchParams.get("force") === "1";
  const existing = await prisma.person.count();
  if (existing > 0 && !force) {
    return NextResponse.json(
      {
        error: "Já existem pessoas no banco. Use ?force=1 para resetar e reseedar.",
        people: existing,
      },
      { status: 409 },
    );
  }

  const pinHash = await bcrypt.hash("1234", 10);

  await prisma.$transaction([
    prisma.swapLog.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.holiday.deleteMany(),
    prisma.person.deleteMany(),
    prisma.settings.deleteMany(),
  ]);

  await prisma.settings.create({
    data: { id: "default", adminPin: pinHash, maxPerDay: 2 },
  });

  const created: Record<string, string> = {};
  for (let i = 0; i < PEOPLE.length; i++) {
    const p = PEOPLE[i];
    const row = await prisma.person.create({
      data: {
        name: p.name,
        color: p.color,
        blockedWeekdays: "[]",
        preferredWeekdays: "[]",
        fixedWeekday: null,
        blockedDates: "[]",
        sortOrder: i,
        active: true,
      },
    });
    created[p.name.toLowerCase()] = row.id;
  }

  const year = new Date().getFullYear();
  await prisma.holiday.createMany({
    data: [
      { date: `${year}-01-01`, name: "Ano Novo" },
      { date: `${year}-04-21`, name: "Tiradentes" },
      { date: `${year}-05-01`, name: "Dia do Trabalho" },
      { date: `${year}-09-07`, name: "Independência" },
      { date: `${year}-10-12`, name: "Nossa Senhora Aparecida" },
      { date: `${year}-11-02`, name: "Finados" },
      { date: `${year}-11-15`, name: "Proclamação da República" },
      { date: `${year}-12-25`, name: "Natal" },
    ],
  });

  let assignments = 0;
  for (const day of SCHEDULE) {
    for (const name of day.names) {
      await prisma.assignment.create({
        data: {
          personId: created[name.toLowerCase()],
          date: day.date,
          monthKey: day.date.slice(0, 7),
        },
      });
      assignments += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    people: PEOPLE.length,
    assignments,
    schedule: SCHEDULE.filter((d) => d.names.length > 0),
  });
}
