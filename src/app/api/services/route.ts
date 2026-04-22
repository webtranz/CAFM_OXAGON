import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  departmentName: z.string().min(2),
  departmentCode: z.string().min(1),
  teamCode: z.string().min(1),
});

export async function GET() {
  return NextResponse.json(await prisma.serviceCatalog.findMany({ include: { team: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const team = await prisma.team.findUnique({ where: { code: input.teamCode } });
    const code = input.departmentCode;
    const created = await prisma.serviceCatalog.upsert({
      where: { code },
      update: {
        name: input.departmentName,
        category: input.departmentName,
        type: "Department Service",
        priority: "MEDIUM",
        slaHours: 24,
        teamId: team?.id,
        description: `Department ${input.departmentName} linked to team ${input.teamCode}`,
      },
      create: {
        code,
        name: input.departmentName,
        category: input.departmentName,
        type: "Department Service",
        priority: "MEDIUM",
        slaHours: 24,
        teamId: team?.id,
        description: `Department ${input.departmentName} linked to team ${input.teamCode}`,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save service");
  }
}
