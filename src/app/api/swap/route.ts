import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { personToDTO } from "@/lib/person-rules";
import { validateSwap } from "@/lib/swap";

export async function POST(request: Request) {
  const body = await request.json();
  const personAId = String(body.personAId ?? "");
  const personBId = String(body.personBId ?? "");
  const dateA = String(body.dateA ?? "");
  const dateB = String(body.dateB ?? "");

  const [personA, personB, settings] = await Promise.all([
    prisma.person.findUnique({ where: { id: personAId } }),
    prisma.person.findUnique({ where: { id: personBId } }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  if (!personA || !personB) {
    return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
  }

  const monthKeys = new Set([dateA.slice(0, 7), dateB.slice(0, 7)]);
  const allAssignments = await prisma.assignment.findMany({
    where: { monthKey: { in: [...monthKeys] } },
  });

  const validation = validateSwap(
    personToDTO(personA),
    personToDTO(personB),
    dateA,
    dateB,
    allAssignments,
    settings?.maxPerDay ?? 2,
  );

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const aAssign = allAssignments.find((x) => x.personId === personAId && x.date === dateA)!;
  const bAssign = allAssignments.find((x) => x.personId === personBId && x.date === dateB)!;

  await prisma.$transaction([
    prisma.assignment.update({
      where: { id: aAssign.id },
      data: { date: dateB, monthKey: dateB.slice(0, 7) },
    }),
    prisma.assignment.update({
      where: { id: bAssign.id },
      data: { date: dateA, monthKey: dateA.slice(0, 7) },
    }),
    prisma.swapLog.create({
      data: {
        personAId,
        personBId,
        dateABefore: dateA,
        dateBBefore: dateB,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: `${personA.name} (${dateA}) ↔ ${personB.name} (${dateB})`,
  });
}

export async function DELETE() {
  const last = await prisma.swapLog.findFirst({
    where: { undone: false },
    orderBy: { createdAt: "desc" },
  });

  if (!last) {
    return NextResponse.json({ error: "Nenhuma troca para desfazer." }, { status: 404 });
  }

  const aNow = await prisma.assignment.findFirst({
    where: { personId: last.personAId, date: last.dateBBefore },
  });
  const bNow = await prisma.assignment.findFirst({
    where: { personId: last.personBId, date: last.dateABefore },
  });

  if (!aNow || !bNow) {
    await prisma.swapLog.update({ where: { id: last.id }, data: { undone: true } });
    return NextResponse.json(
      { error: "Estado das atribuições mudou; troca marcada como desfeita sem reverter." },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.assignment.update({
      where: { id: aNow.id },
      data: { date: last.dateABefore, monthKey: last.dateABefore.slice(0, 7) },
    }),
    prisma.assignment.update({
      where: { id: bNow.id },
      data: { date: last.dateBBefore, monthKey: last.dateBBefore.slice(0, 7) },
    }),
    prisma.swapLog.update({ where: { id: last.id }, data: { undone: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
