import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionCookieName } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.active) {
      await auditAction({ user: null, action: "LOGIN_FAILED", entity: "auth", entityId: input.email, details: { email: input.email, reason: user ? "inactive_user" : "unknown_user" } });
      return apiError(new Error("Invalid login."), "Invalid login", 401);
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      await auditAction({ user, action: "LOGIN_FAILED", entity: "auth", entityId: user.id, details: { email: input.email, reason: "invalid_password" } });
      return apiError(new Error("Invalid login."), "Invalid login", 401);
    }

    const response = NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
    response.cookies.set(sessionCookieName, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    await auditAction({ user, action: "LOGIN_SUCCESS", entity: "auth", entityId: user.id, details: { email: user.email, role: user.role, active: user.active } });
    return response;
  } catch (error) {
    return apiError(error, "Login failed");
  }
}
