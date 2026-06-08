import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireAdmin, requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().optional(),
  area: z.string().optional(),
  inspector: z.string().optional(),
  risk: z.string().optional(),
  score: z.coerce.number().int().min(0).max(100).optional(),
  findings: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("reports.view");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.inspection.count();
    const created = await prisma.inspection.create({
      data: {
        ...input,
        title: input.title || `Inspection ${count + 1}`,
        area: input.area || "General",
        inspector: input.inspector || "Inspector",
        risk: ["LOW", "MODERATE", "HIGH", "EXTREME"].includes(input.risk || "") ? input.risk as any : "LOW",
        score: input.score ?? 100,
        findings: input.findings || "No findings recorded.",
        code: `INS-${String(count + 1001).padStart(5, "0")}`,
        status: (input.score ?? 100) < 80 ? "TRIAGED" : "COMPLETED",
        dueAt: addDays(new Date(), 7),
      },
    });

    await auditAction({ user, action: "INSPECTION_CREATE", entity: "inspection", entityId: created.id, details: { input, createdRecord: created } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create inspection");
  }
}

export async function DELETE(request: Request) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("Inspection id is required");
    const current = await prisma.inspection.findUnique({ where: { id } });
    if (!current) throw new Error("Inspection not found");
    await prisma.inspection.delete({ where: { id } });
    await auditAction({ user, action: "INSPECTION_DELETE", entity: "inspection", entityId: id, details: { deletedRecord: current } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete inspection");
  }
}
