import { NextResponse } from "next/server";
import { auditAction } from "@/lib/audit";
import { getCurrentUser, sessionCookieName } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  await auditAction({ user, action: "LOGOUT", entity: "auth", entityId: user?.id || "anonymous", details: { email: user?.email ?? null, role: user?.role ?? null } });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
