import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { sessionCookieName } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.active) return apiError(new Error("Invalid login."), "Invalid login", 401);

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) return apiError(new Error("Invalid login."), "Invalid login", 401);

    const response = NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
    response.cookies.set(sessionCookieName, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    return apiError(error, "Login failed");
  }
}
