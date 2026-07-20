import { NextResponse } from "next/server";
import { canPersonTakeDay, personToDTO, rulesFromPerson } from "@/lib/person-rules";
import { prisma } from "@/lib/db";
import { toWorkdayIndex, weekKey } from "@/lib/dates";

/** Place or move a person onto a pizza day. */
export async function POST(request: Request) {
  const body = await request.json();
  const personId = String(body.personId ?? "");
  const date = String(body.date ?? "");
  const maxPerDay = (
    await prisma.settings.findUnique({ where: { id: "default" } })
  )?.maxPerDay ?? 2;

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person || !person.active) {
    return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
  }

  const wd = toWorkdayIndex(new Date(date + "T12:00:00"));
  if (wd < 0) {
    return NextResponse.json({ error: "Só dias úteis (seg–sex)." }, { status: 400 });
  }

  const dto = personToDTO(person);
  if (!canPersonTakeDay(rulesFromPerson(dto), date, wd)) {
    return NextResponse.json(
      { error: `${person.name} não pode comer pizza nesse dia (restrição).` },
      { status: 400 },
    );
  }

  const holiday = await prisma.holiday.findUnique({ where: { date } });
  if (holiday) {
    return NextResponse.json({ error: `Feriado: ${holiday.name}` }, { status: 400 });
  }

  const monthKey = date.slice(0, 7);
  const existingOnDay = await prisma.assignment.findMany({ where: { date } });
  if (existingOnDay.some((a) => a.personId === personId)) {
    return NextResponse.json({ error: "Já está nesse dia." }, { status: 400 });
  }
  if (existingOnDay.length >= maxPerDay) {
    return NextResponse.json(
      { error: `Mesa cheia nesse dia (máx. ${maxPerDay}).` },
      { status: 400 },
    );
  }

  // Enforce 1 pizza/week: remove other assignment same week if any
  const allMonth = await prisma.assignment.findMany({
    where: { personId, monthKey: { in: [monthKey, adjacentMonth(date, -1), adjacentMonth(date, 1)] } },
  });
  const sameWeek = allMonth.filter((a) => weekKey(a.date) === weekKey(date));

  await prisma.$transaction([
    ...sameWeek.map((a) => prisma.assignment.delete({ where: { id: a.id } })),
    prisma.assignment.create({
      data: { personId, date, monthKey },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const personId = String(body.personId ?? "");
  const date = String(body.date ?? "");

  const row = await prisma.assignment.findFirst({ where: { personId, date } });
  if (!row) {
    return NextResponse.json({ error: "Nada para remover." }, { status: 404 });
  }
  await prisma.assignment.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}

function adjacentMonth(iso: string, delta: number): string {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
