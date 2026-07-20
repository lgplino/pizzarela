import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PEOPLE = [
  { name: "Isa", color: "#E6392B" },
  { name: "Bruno", color: "#2D6A4F" },
  { name: "Jojo", color: "#F4A261" },
  { name: "Rossi", color: "#457B9D" },
  { name: "Lino", color: "#9B2226" },
  { name: "Sala", color: "#6A994E" },
];

/** Cronograma das próximas duas semanas (jul/2026) */
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

async function main() {
  const pinHash = await bcrypt.hash("1234", 10);

  await prisma.swapLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.person.deleteMany();
  await prisma.settings.deleteMany();

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

  for (const day of SCHEDULE) {
    for (const name of day.names) {
      const personId = created[name.toLowerCase()];
      if (!personId) throw new Error(`Pessoa não encontrada: ${name}`);
      await prisma.assignment.create({
        data: {
          personId,
          date: day.date,
          monthKey: day.date.slice(0, 7),
        },
      });
    }
  }

  console.log("Seed OK — Pizzarela com cronograma 20/07 e 27/07");
  console.log(`${PEOPLE.length} pessoas, ${SCHEDULE.flatMap((s) => s.names).length} fatias`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
