import { NextResponse } from "next/server";
import { z } from "zod";
import { addHours } from "date-fns";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  departmentCode: z.string().optional(),
  serviceCode: z.string().optional(),
  assignedTeamCode: z.string().optional(),
  requester: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  location: z.string().min(2),
  description: z.string().min(3),
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
    const count = await prisma.serviceRequest.count();
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

    const created = await prisma.serviceRequest.create({
      data: {
        ...input,
        assignedSupervisorEmail: supervisor?.email || null,
        channel: "Web Portal",
        ticketNo: `SR-${String(count + 24001).padStart(5, "0")}`,
        slaHours,
        dueAt: addHours(new Date(), slaHours),
        status: input.priority === "CRITICAL" ? "TRIAGED" : "NEW",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to create service request",
      },
      { status: 500 },
    );
  }
}
