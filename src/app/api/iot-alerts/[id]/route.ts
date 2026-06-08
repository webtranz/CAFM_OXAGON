import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = await requirePermission("reports.view");
    if (error) return error;
    const { id } = await params;
    const current = await prisma.iotAlert.findUnique({ where: { id } });
    if (!current) throw new Error("IoT alert not found");
    const updated = await prisma.iotAlert.update({
      where: { id },
      data: { status: "TRIAGED" },
    });
    await auditAction({ user, action: "IOT_ALERT_TRIAGE", entity: "iot_alert", entityId: id, details: { before: current, after: updated } });

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Unable to update IoT alert");
  }
}
