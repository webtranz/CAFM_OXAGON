import { NextResponse } from "next/server";
import { z } from "zod";
import { addHours } from "date-fns";
import { accessRole } from "@/lib/access-control";
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
  type: z.string().optional(),
  assetType: z.string().optional(),
  departmentCode: z.string().optional(),
  serviceCode: z.string().optional(),
  assignedTeamCode: z.string().optional(),
  assignedToEmail: z.string().optional(),
  jobPlanCode: z.string().optional(),
  priority: z.string().optional(),
  assetTag: z.string().optional(),
  jobPlan: z.string().optional(),
  photoUrls: z.string().optional(),
  isIncidentCase: booleanInput,
});

const dueHours = {
  LOW: 120,
  MEDIUM: 72,
  HIGH: 24,
  CRITICAL: 6,
};

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await getCurrentUser();
    const role = accessRole(user);
    if (!["admin", "supervisor"].includes(role)) {
      return NextResponse.json({ message: "Only Admin or Supervisor can create work orders." }, { status: 403 });
    }
    const priority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(input.priority || "") ? input.priority as keyof typeof dueHours : "MEDIUM";
    const [count, asset, team] = await Promise.all([
      prisma.workOrder.count(),
      input.assetTag ? prisma.asset.findUnique({ where: { tag: input.assetTag } }) : null,
      input.assignedTeamCode ? prisma.team.findUnique({ where: { code: input.assignedTeamCode } }) : null,
    ]);

    const created = await prisma.workOrder.create({
      data: {
        woNo: `WO-${String(count + 81001).padStart(5, "0")}`,
        title: input.title || `Work Order ${count + 1}`,
        type: input.type || "Reactive",
        assetType: input.assetType || asset?.assetGroup || asset?.category || null,
        departmentCode: input.departmentCode || user?.department || null,
        serviceCode: input.serviceCode || null,
        assignedTeamCode: input.assignedTeamCode || team?.code || null,
        jobPlanCode: input.jobPlanCode || null,
        priority,
        status: input.assignedTeamCode ? "ASSIGNED" : "PENDING_ASSIGNMENT",
        assetId: asset?.id,
        assignedToId: null,
        plannedStart: new Date(),
        dueAt: addHours(new Date(), dueHours[priority]),
        estimatedHours: priority === "CRITICAL" ? 2 : 4,
        cost: 0,
        jobPlan: input.jobPlan || input.title || "Work to be defined by supervisor.",
        safetyNotes: "Supervisor must verify permits, isolation and access requirements before work starts.",
        photoUrls: input.photoUrls || null,
        isIncidentCase: input.isIncidentCase ?? false,
      },
    });

    if (asset?.id) {
      await prisma.assetHistory.create({
        data: {
          assetId: asset.id,
          eventType: "WORK_ORDER_CREATED",
          title: `${created.woNo} created`,
          details: `${created.title} assigned to ${created.assignedTeamCode || "unassigned team"}.`,
          actor: user?.name || user?.email || "System",
        },
      });
    }

    await auditAction({ user, action: "WORK_ORDER_CREATE", entity: "work_order", entityId: created.id, details: { input, createdRecord: created } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to create work order",
      },
      { status: 500 },
    );
  }
}
