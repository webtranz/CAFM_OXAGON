import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireAdmin, requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  teamName: z.string().optional(),
  name: z.string().optional(),
  departmentName: z.string().optional(),
  departmentCode: z.string().optional(),
  teamCode: z.string().optional(),
  companyIdNumber: z.string().optional(),
  service: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

function teamData(input: z.infer<typeof schema>) {
  const name = input.teamName || input.name || input.departmentName || input.teamCode || "Service Team";
  const service = input.service || input.departmentName || "Service Team";
  return {
    code: input.teamCode || input.departmentCode || undefined,
    name,
    type: service,
    supervisor: input.companyIdNumber || input.departmentCode || "",
    phone: input.phone || "",
    email: input.email || "",
    shift: "General",
    coverage: input.departmentCode || "General",
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requirePermission("requests.manage");
    if (error) return error;
    const { id } = await params;
    const input = schema.parse(await request.json());
    const current = await prisma.team.findUnique({ where: { id } });
    if (!current) throw new Error("Team not found");
    const team = await prisma.team.update({
      where: { id },
      data: teamData(input),
    });
    await auditAction({ user, action: "TEAM_UPDATE", entity: "team", entityId: id, details: { before: current, input, after: team } });
    return NextResponse.json(team);
  } catch (error) {
    return apiError(error, "Unable to update team");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    const current = await prisma.team.findUnique({ where: { id } });
    if (!current) throw new Error("Team not found");
    await prisma.$transaction([
      prisma.serviceCatalog.updateMany({ where: { teamId: id }, data: { teamId: null } }),
      prisma.user.updateMany({ where: { teamId: id }, data: { teamId: null } }),
      prisma.team.delete({ where: { id } }),
    ]);
    await auditAction({ user, action: "TEAM_DELETE", entity: "team", entityId: id, details: { deletedRecord: current } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete team");
  }
}
