import { NextResponse } from "next/server";
import { z } from "zod";
import { addHours } from "date-fns";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  departmentCode: z.string().optional(),
  serviceCode: z.string().optional(),
  assignedTeamCode: z.string().optional(),
  requester: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["OPEN", "NEW", "TRIAGED", "APPROVED", "REJECTED", "PENDING_ASSIGNMENT", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "VERIFIED", "REOPENED", "CLOSED"]),
  location: z.string().min(2),
  attachmentUrls: z.string().optional(),
  rejectionReason: z.string().optional(),
  description: z.string().min(3),
});

const slaByPriority = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 12,
  CRITICAL: 4,
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const slaHours = slaByPriority[input.priority];
    const department = input.departmentCode ? await prisma.department.findUnique({ where: { code: input.departmentCode } }) : null;
    const supervisor = input.departmentCode
      ? await prisma.user.findFirst({
          where: {
            role: { contains: "Supervisor", mode: "insensitive" },
            department: { in: [input.departmentCode, department?.name ?? input.departmentCode] },
          },
        })
      : null;
    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        ...input,
        assignedSupervisorEmail: supervisor?.email || null,
        slaHours,
        dueAt: addHours(new Date(), slaHours),
        reviewedAt: ["TRIAGED", "APPROVED", "REJECTED"].includes(input.status) ? new Date() : undefined,
        approvedAt: input.status === "APPROVED" ? new Date() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Unable to update service request");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.serviceRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete service request");
  }
}
