import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const sessionCookieName = "cafm_session";

export async function getCurrentUser() {
  const jar = await cookies();
  const userId = jar.get(sessionCookieName)?.value;
  if (!userId) return null;

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, department: true },
    });
  } catch {
    return null;
  }
}
