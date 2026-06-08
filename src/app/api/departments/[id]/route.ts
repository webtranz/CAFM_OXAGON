import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireAdmin, requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  siteLocation: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requirePermission("users.manage");
    if (error) return error;
    const { id } = await params;
    const input = schema.parse(await request.json());
    const current = await prisma.department.findUnique({ where: { id } });
    if (!current) throw new Error("Department not found");
    const department = await prisma.department.update({
      where: { id },
      data: {
        code: input.code,
        name: input.name,
        siteLocation: input.siteLocation,
        description: input.description,
      },
    });
    await auditAction({ user, action: "DEPARTMENT_UPDATE", entity: "department", entityId: id, details: { before: current, input, after: department } });
    return NextResponse.json(department);
  } catch (error) {
    return apiError(error, "Unable to update department");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    const current = await prisma.department.findUnique({ where: { id } });
    if (!current) throw new Error("Department not found");
    await prisma.department.delete({ where: { id } });
    await auditAction({ user, action: "DEPARTMENT_DELETE", entity: "department", entityId: id, details: { deletedRecord: current } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete department");
  }
}
