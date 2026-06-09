import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  departmentName: z.string().optional(),
  departmentCode: z.string().optional(),
  teamCode: z.string().optional(),
  slaHours: z.coerce.number().optional(),
});

export async function GET() {
  return NextResponse.json(await prisma.serviceCatalog.findMany({ include: { team: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("requests.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.serviceCatalog.count();
    const code = input.departmentCode || `SRV-${String(count + 1).padStart(4, "0")}`;
    const name = input.departmentName || "General Service";
    const team = input.teamCode ? await prisma.team.findUnique({ where: { code: input.teamCode } }) : null;
    const created = await prisma.serviceCatalog.upsert({
      where: { code },
      update: {
        name,
        category: name,
        type: "Department Service",
        priority: "MEDIUM",
        slaHours: input.slaHours || 24,
        teamId: team?.id,
        description: `Department ${name}`,
      },
      create: {
        code,
        name,
        category: name,
        type: "Department Service",
        priority: "MEDIUM",
        slaHours: input.slaHours || 24,
        teamId: team?.id,
        description: `Department ${name}`,
      },
    });
    await auditAction({ user, action: "SERVICE_SAVE", entity: "service_catalog", entityId: created.id, details: { input, savedRecord: created } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save service");
  }
}
