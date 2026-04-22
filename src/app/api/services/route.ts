import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  type: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  slaHours: z.coerce.number().int().min(1),
  teamCode: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  return NextResponse.json(await prisma.serviceCatalog.findMany({ include: { team: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const team = input.teamCode ? await prisma.team.findUnique({ where: { code: input.teamCode } }) : null;
    const created = await prisma.serviceCatalog.upsert({
      where: { code: input.code },
      update: {
        name: input.name,
        category: input.category,
        type: input.type,
        priority: input.priority,
        slaHours: input.slaHours,
        teamId: team?.id,
        description: input.description || "",
      },
      create: {
        code: input.code,
        name: input.name,
        category: input.category,
        type: input.type,
        priority: input.priority,
        slaHours: input.slaHours,
        teamId: team?.id,
        description: input.description || "",
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save service");
  }
}
