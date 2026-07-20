import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(holidays);
}

export async function POST(request: Request) {
  const body = await request.json();
  const holiday = await prisma.holiday.create({
    data: {
      date: String(body.date),
      name: String(body.name ?? "Feriado"),
    },
  });
  return NextResponse.json(holiday);
}

export async function DELETE(request: Request) {
  const body = await request.json();
  await prisma.holiday.delete({ where: { id: String(body.id) } });
  return NextResponse.json({ ok: true });
}
