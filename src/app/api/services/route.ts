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
  const departments = await assetDepartments();
  return NextResponse.json(await prisma.serviceCatalog.findMany({ where: { code: { in: departments } }, include: { team: true }, orderBy: { name: "asc" } }));
}

async function assetDepartments() {
  const rows = await prisma.asset.findMany({
    where: { departmentCode: { not: null } },
    distinct: ["departmentCode"],
    select: { departmentCode: true },
    orderBy: { departmentCode: "asc" },
  });
  return rows.map((row) => row.departmentCode).filter(Boolean) as string[];
}

async function assetDepartment(code: string | undefined) {
  const departmentCode = String(code || "").trim();
  if (!departmentCode) throw new Error("Select a department code from the asset register.");
  const asset = await prisma.asset.findFirst({ where: { departmentCode }, select: { departmentCode: true } });
  if (!asset) throw new Error(`Department code ${departmentCode} is not linked to any asset.`);
  return departmentCode;
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("requests.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const code = await assetDepartment(input.departmentCode);
    const name = input.departmentName || `Department ${code}`;
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
