import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { personToDTO } from "@/lib/person-rules";

export async function GET() {
  const people = await prisma.person.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(people.map(personToDTO));
}

export async function POST(request: Request) {
  const body = await request.json();
  const count = await prisma.person.count();
  const person = await prisma.person.create({
    data: {
      name: String(body.name ?? "Nova pessoa"),
      color: String(body.color ?? "#E6392B"),
      blockedWeekdays: JSON.stringify(body.blockedWeekdays ?? []),
      preferredWeekdays: JSON.stringify(body.preferredWeekdays ?? []),
      fixedWeekday:
        body.fixedWeekday === null || body.fixedWeekday === undefined
          ? null
          : Number(body.fixedWeekday),
      blockedDates: JSON.stringify(body.blockedDates ?? []),
      sortOrder: count,
      active: body.active !== false,
    },
  });
  return NextResponse.json(personToDTO(person));
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = String(body.name);
  if (body.color != null) data.color = String(body.color);
  if (body.blockedWeekdays != null) data.blockedWeekdays = JSON.stringify(body.blockedWeekdays);
  if (body.preferredWeekdays != null)
    data.preferredWeekdays = JSON.stringify(body.preferredWeekdays);
  if (body.fixedWeekday !== undefined) {
    data.fixedWeekday =
      body.fixedWeekday === null || body.fixedWeekday === ""
        ? null
        : Number(body.fixedWeekday);
  }
  if (body.blockedDates != null) data.blockedDates = JSON.stringify(body.blockedDates);
  if (body.active != null) data.active = Boolean(body.active);

  const person = await prisma.person.update({ where: { id }, data });
  return NextResponse.json(personToDTO(person));
}

export async function DELETE(request: Request) {
  const body = await request.json();
  await prisma.person.delete({ where: { id: String(body.id) } });
  return NextResponse.json({ ok: true });
}
