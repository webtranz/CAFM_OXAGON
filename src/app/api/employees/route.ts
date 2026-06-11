import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  companyId: z.string().optional(),
  nationalityType: z.string().optional(),
  departmentCode: z.string().optional(),
  siteLocation: z.string().optional(),
  shiftEligibility: z.string().optional(),
  defaultShift: z.string().optional(),
  serviceTeamCode: z.string().optional(),
  supervisor: z.string().optional(),
  workLocationZone: z.string().optional(),
  maxHoursPerDay: z.coerce.number().optional(),
  maxConsecutiveDays: z.coerce.number().optional(),
  minRestHours: z.coerce.number().optional(),
});

export async function GET() {
  const { error } = await requirePermission("users.manage");
  if (error) return error;
  return NextResponse.json(await prisma.employee.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("users.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.employee.count();
    const companyId = input.companyId || `EMP-${String(count + 1).padStart(5, "0")}`;
    const data = {
      name: input.name || `Employee ${count + 1}`,
      email: input.email || `${companyId.toLowerCase()}@cafm.local`,
      companyId,
      nationalityType: input.nationalityType || "Not specified",
      departmentCode: input.departmentCode || "General",
      siteLocation: input.siteLocation || "Main Site",
      shiftEligibility: input.shiftEligibility || "Day & Night",
      defaultShift: input.defaultShift || "General",
      serviceTeamCode: input.serviceTeamCode || "",
      supervisor: input.supervisor || "",
      workLocationZone: input.workLocationZone || input.siteLocation || "Main Site",
      maxHoursPerDay: input.maxHoursPerDay || 8,
      maxConsecutiveDays: input.maxConsecutiveDays || 6,
      minRestHours: input.minRestHours || 12,
    };
    const employee = await prisma.employee.upsert({
      where: { companyId },
      update: data,
      create: data,
    });
    await auditAction({ user, action: "EMPLOYEE_SAVE", entity: "employee", entityId: employee.id, details: { input, savedRecord: employee } });
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save employee");
  }
}
