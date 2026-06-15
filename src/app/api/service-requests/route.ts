import { NextResponse } from "next/server";
import { z } from "zod";
import { addHours } from "date-fns";
import { auditAction } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const booleanInput = z.preprocess((value) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean()).optional();

const schema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  departmentCode: z.string().optional(),
  serviceCode: z.string().optional(),
  assignedTeamCode: z.string().optional(),
  requester: z.string().optional(),
  priority: z.string().optional(),
  location: z.string().optional(),
  attachmentUrls: z.string().optional(),
  description: z.string().optional(),
  isIncidentCase: booleanInput,
});

const slaByPriority = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 12,
  CRITICAL: 4,
};

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await getCurrentUser();
    const count = await prisma.serviceRequest.count();
    const priority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(input.priority || "") ? input.priority as keyof typeof slaByPriority : "MEDIUM";
    const slaHours = slaByPriority[priority];
    const department = input.departmentCode ? await prisma.department.findUnique({ where: { code: input.departmentCode } }) : null;
    const supervisor = input.departmentCode
      ? await prisma.user.findFirst({
          where: {
            role: { contains: "Supervisor", mode: "insensitive" },
            department: { in: [input.departmentCode, department?.name ?? input.departmentCode] },
          },
        })
      : null;

    const created = await prisma.serviceRequest.create({
      data: {
        title: input.title || `Service Request ${count + 1}`,
        category: input.category || "General",
        departmentCode: input.departmentCode || null,
        serviceCode: input.serviceCode || null,
        assignedTeamCode: input.assignedTeamCode || null,
        requester: input.requester || user?.name || user?.email || "Requester",
        priority,
        location: input.location || "Unassigned",
        attachmentUrls: input.attachmentUrls || null,
        description: input.description || input.title || "No description provided.",
        isIncidentCase: input.isIncidentCase ?? false,
        assignedSupervisorEmail: supervisor?.email || null,
        channel: "Web Portal",
        ticketNo: `SR-${String(count + 24001).padStart(5, "0")}`,
        slaHours,
        dueAt: addHours(new Date(), slaHours),
        status: "NEW",
      },
    });

    await auditAction({ user, action: "SERVICE_REQUEST_CREATE", entity: "service_request", entityId: created.id, details: { input, createdRecord: created } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Unable to create service request",
      },
      { status: 500 },
    );
  }
}
