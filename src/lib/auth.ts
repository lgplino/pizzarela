import bcrypt from "bcryptjs";
import { prisma } from "./db";

const DEFAULT_PIN = "1234";

export async function ensureSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  const hash = await bcrypt.hash(DEFAULT_PIN, 10);
  return prisma.settings.create({
    data: { id: "default", adminPin: hash, maxPerDay: 2 },
  });
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const settings = await ensureSettings();
  return bcrypt.compare(pin, settings.adminPin);
}

export async function updateAdminPin(currentPin: string, newPin: string) {
  const ok = await verifyAdminPin(currentPin);
  if (!ok) return { ok: false as const, error: "PIN atual incorreto." };
  const hash = await bcrypt.hash(newPin, 10);
  await prisma.settings.update({
    where: { id: "default" },
    data: { adminPin: hash },
  });
  return { ok: true as const };
}

export { DEFAULT_PIN };
