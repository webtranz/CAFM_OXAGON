import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { apiError } from "@/lib/api-response";
import { canManageDepartmentRecord } from "@/lib/access-control";
import { auditAction } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dueHours = { LOW: 120, MEDIUM: 72, HIGH: 24, CRITICAL: 6 };

export async function POST(requestBody: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await requestBody.json().catch(() => ({}));
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new Error("Service request not found");
    const user = await getCurrentUser();
    if (!canManageDepartmentRecord(user, request.departmentCode)) {
      return apiError(new Error("Only Admin or the department Supervisor can convert this request."), "Access denied", 403);
    }
    const existingWorkOrder = await prisma.workOrder.findUnique({ where: { requestId: id } });
    if (existingWorkOrder) {
      return NextResponse.json(existingWorkOrder);
    }

    const assignedTeamCode = body.assignedTeamCode || request.assignedTeamCode || null;
    const [count] = await Promise.all([
      prisma.workOrder.count(),
    ]);

    const workOrder = await prisma.workOrder.create({
      data: {
        woNo: `WO-${String(count + 81001).padStart(5, "0")}`,
        title: request.title,
        type: "Reactive",
        departmentCode: request.departmentCode,
        serviceCode: request.serviceCode,
        assignedTeamCode,
        priority: request.priority,
        status: assignedTeamCode ? "ASSIGNED" : "PENDING_ASSIGNMENT",
        requestId: request.id,
        assignedToId: null,
        plannedStart: new Date(),
        dueAt: addHours(new Date(), dueHours[request.priority]),
        estimatedHours: request.priority === "CRITICAL" ? 2 : 4,
        cost: 0,
        jobPlan: request.description,
        safetyNotes: "Supervisor to verify access, PPE, isolation and permits before dispatch.",
      },
    });

    await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        assignedTeamCode,
        approvedAt: new Date(),
        reviewedAt: new Date(),
      },
    });
    await auditAction({ user, action: "SERVICE_REQUEST_CONVERT_TO_WORK_ORDER", entity: "service_request", entityId: id, details: workOrder.woNo });
    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to convert request to work order");
  }
}
