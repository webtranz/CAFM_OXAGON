import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const dueHours = { LOW: 120, MEDIUM: 72, HIGH: 24, CRITICAL: 6 };

export async function POST(requestBody: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await requestBody.json().catch(() => ({}));
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new Error("Service request not found");
    const existingWorkOrder = await prisma.workOrder.findUnique({ where: { requestId: id } });
    if (existingWorkOrder) {
      return NextResponse.json(existingWorkOrder);
    }

    const assignedTeamCode = body.assignedTeamCode || request.assignedTeamCode || null;
    const assignedToEmail = body.assignedToEmail || null;
    const [count, technician] = await Promise.all([
      prisma.workOrder.count(),
      assignedToEmail
        ? prisma.user.findUnique({ where: { email: assignedToEmail } })
        : assignedTeamCode
        ? prisma.user.findFirst({ where: { team: { code: assignedTeamCode }, active: true } })
        : prisma.user.findFirst({ where: { role: { contains: "Technician", mode: "insensitive" }, active: true } }),
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
        status: technician ? "ASSIGNED" : "PENDING_ASSIGNMENT",
        requestId: request.id,
        assignedToId: technician?.id ?? null,
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
    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to convert request to work order");
  }
}
