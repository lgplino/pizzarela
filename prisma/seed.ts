import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { SEED_PEOPLE, SEED_SCHEDULE } from "../src/lib/seed-data";

const prisma = new PrismaClient();

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
  for (let i = 0; i < SEED_PEOPLE.length; i++) {
    const p = SEED_PEOPLE[i];
    const row = await prisma.person.create({
      data: {
        name: p.name,
        color: p.color,
        blockedWeekdays: "[]",
        preferredWeekdays: JSON.stringify(p.preferredWeekdays),
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

  for (const day of SEED_SCHEDULE) {
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

  console.log("Seed OK — Pizzarela");
  console.log(
    `${SEED_PEOPLE.length} pessoas (Lino+Lucas preferem seg/qua/sex), ${SEED_SCHEDULE.flatMap((s) => s.names).length} fatias iniciais`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
