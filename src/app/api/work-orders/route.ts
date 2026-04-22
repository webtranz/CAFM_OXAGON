import { NextResponse } from "next/server";
import { z } from "zod";
import { addHours } from "date-fns";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(3),
  type: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assetTag: z.string().optional(),
  jobPlan: z.string().min(3),
});

const dueHours = {
  LOW: 120,
  MEDIUM: 72,
  HIGH: 24,
  CRITICAL: 6,
};

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  const [count, asset, technician] = await Promise.all([
    prisma.workOrder.count(),
    input.assetTag ? prisma.asset.findUnique({ where: { tag: input.assetTag } }) : null,
    prisma.user.findFirst({ where: { role: "Technician" } }),
  ]);

  const created = await prisma.workOrder.create({
    data: {
      woNo: `WO-${String(count + 81001).padStart(5, "0")}`,
      title: input.title,
      type: input.type,
      priority: input.priority,
      status: "ASSIGNED",
      assetId: asset?.id,
      assignedToId: technician?.id,
      plannedStart: new Date(),
      dueAt: addHours(new Date(), dueHours[input.priority]),
      estimatedHours: input.priority === "CRITICAL" ? 2 : 4,
      cost: 0,
      jobPlan: input.jobPlan,
      safetyNotes: "Supervisor must verify permits, isolation and access requirements before work starts.",
    },
  });

  return NextResponse.json(created, { status: 201 });
}
