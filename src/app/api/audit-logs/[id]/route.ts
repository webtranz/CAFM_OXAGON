import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requirePermission("reports.view");
    if (error) return error;
    const { id } = await params;
    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log) return NextResponse.json({ error: "Audit log not found" }, { status: 404 });
    return NextResponse.json(log);
  } catch (error) {
    return apiError(error, "Unable to load audit log");
  }
}
