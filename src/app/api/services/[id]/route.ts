import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireAdmin, requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  departmentName: z.string().optional(),
  departmentCode: z.string().optional(),
  teamCode: z.string().optional(),
  slaHours: z.coerce.number().optional(),
});

async function serviceData(input: z.infer<typeof schema>) {
  const team = input.teamCode ? await prisma.team.findUnique({ where: { code: input.teamCode } }) : null;
  const code = input.departmentCode || undefined;
  const name = input.departmentName || code || "General Service";
  return {
    code,
    name,
    category: name,
    type: "Department Service",
    priority: "MEDIUM" as const,
    slaHours: input.slaHours || 24,
    teamId: team?.id,
    description: `Department ${name}`,
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requirePermission("requests.manage");
    if (error) return error;
    const { id } = await params;
    const input = schema.parse(await request.json());
    const current = await prisma.serviceCatalog.findUnique({ where: { id } });
    if (!current) throw new Error("Service not found");
    const service = await prisma.serviceCatalog.update({
      where: { id },
      data: await serviceData(input),
    });
    await auditAction({ user, action: "SERVICE_UPDATE", entity: "service_catalog", entityId: id, details: { before: current, input, after: service } });
    return NextResponse.json(service);
  } catch (error) {
    return apiError(error, "Unable to update service");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    const current = await prisma.serviceCatalog.findUnique({ where: { id } });
    if (!current) throw new Error("Service not found");
    await prisma.serviceCatalog.delete({ where: { id } });
    await auditAction({ user, action: "SERVICE_DELETE", entity: "service_catalog", entityId: id, details: { deletedRecord: current } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete service");
  }
}
