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

export async function GET() {
  return NextResponse.json(await prisma.user.findMany({ include: { team: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const team = input.teamCode ? await prisma.team.findUnique({ where: { code: input.teamCode } }) : null;
    const created = await prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        phone: input.phone || null,
        role: input.role,
        department: input.department || "General",
        supervisorEmail: input.supervisorEmail || null,
        notifyWorkOrder: input.notifyWorkOrder ?? false,
        notifyFacilityBooking: input.notifyFacilityBooking ?? false,
        teamId: team?.id,
        active: input.active ?? true,
      },
      create: {
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
        passwordHash: await bcrypt.hash(input.password || "Welcome@123", 10),
      },
    });
    return NextResponse.json({ ...created, passwordHash: undefined }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save user");
  }
}
