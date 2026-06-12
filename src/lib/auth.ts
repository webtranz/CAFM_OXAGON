import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const sessionCookieName = "cafm_session";
export const sandboxAdmin = {
  id: "admin-local",
  name: "System Administrator",
  email: "admin@cafm.local",
  role: "Admin",
  department: "Administration",
  team: null,
};
export const sandboxAdminPassword = "Admin@12345";
const sessionMaxAgeSeconds = 60 * 60 * 12;

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || process.env.DATABASE_URL || "cafm-development-session-secret";
}

function signSessionValue(userId: string, expiresAt: number) {
  return createHmac("sha256", sessionSecret()).update(`${userId}.${expiresAt}`).digest("hex");
}

export function createSessionToken(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds;
  return `${userId}.${expiresAt}.${signSessionValue(userId, expiresAt)}`;
}

function verifySessionToken(token: string) {
  const [userId, expiresAtValue, signature] = token.split(".");
  const expiresAt = Number(expiresAtValue);
  if (!userId || !signature || !Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
  const expected = signSessionValue(userId, expiresAt);
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return userId;
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName)?.value;
  const userId = token ? verifySessionToken(token) : null;
  if (!userId) return null;

  if (!process.env.DATABASE_URL && userId === sandboxAdmin.id) {
    return sandboxAdmin;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, department: true, team: { select: { code: true, name: true } } },
    });
  } catch {
    return null;
  }
}
