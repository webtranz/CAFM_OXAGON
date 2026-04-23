import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().optional(),
  role: z.string().min(2),
  department: z.string().optional(),
  supervisorEmail: z.string().optional(),
  notifyWorkOrder: z.coerce.boolean().optional(),
  notifyFacilityBooking: z.coerce.boolean().optional(),
  teamCode: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const team = input.teamCode ? await prisma.team.findUnique({ where: { code: input.teamCode } }) : null;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
        department: input.department || "General",
        supervisorEmail: input.supervisorEmail || null,
        notifyWorkOrder: input.notifyWorkOrder ?? false,
        notifyFacilityBooking: input.notifyFacilityBooking ?? false,
        teamId: team?.id,
        active: input.active ?? true,
        passwordHash: input.password ? await bcrypt.hash(input.password, 10) : undefined,
      },
    });
    return NextResponse.json({ ...updated, passwordHash: undefined });
  } catch (error) {
    return apiError(error, "Unable to update user");
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.email === "admin@cafm.local") {
      return apiError(new Error("Initial admin user cannot be deleted."), "Unable to delete user", 400);
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete user");
  }
}
