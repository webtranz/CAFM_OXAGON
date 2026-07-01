import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireAdmin, requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { paginationMeta, readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  assetType: z.string().optional(),
  departmentCode: z.string().optional(),
  serviceCode: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  priority: z.string().optional(),
  steps: z.string().optional(),
  safetyNotes: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pagination = readPagination(url);
  const [total, jobPlans] = await Promise.all([
    prisma.jobPlan.count(),
    prisma.jobPlan.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { code: "asc" },
    }),
  ]);
  return NextResponse.json({ jobPlans, total, ...paginationMeta(total, pagination) });
}

export async function DELETE(request: Request) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("Job plan id is required");
    const current = await prisma.jobPlan.findUnique({ where: { id } });
    if (!current) throw new Error("Job plan not found");
    await prisma.jobPlan.delete({ where: { id } });
    await auditAction({ user, action: "JOB_PLAN_DELETE", entity: "job_plan", entityId: id, details: { deletedRecord: current } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete job plan");
  }
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("work.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.jobPlan.count();
    const code = input.code || `JP-${String(count + 1).padStart(4, "0")}`;
    const data = {
      code,
      name: input.name || `Job Plan ${count + 1}`,
      assetType: input.assetType || "General",
      departmentCode: input.departmentCode || null,
      serviceCode: input.serviceCode || null,
      estimatedHours: input.estimatedHours ?? 1,
      priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(input.priority || "") ? input.priority as any : "MEDIUM",
      steps: input.steps || "Define work steps.",
      safetyNotes: input.safetyNotes || "",
    };
    const jobPlan = await prisma.jobPlan.upsert({
      where: { code },
      update: data,
      create: data,
    });
    await auditAction({ user, action: "JOB_PLAN_SAVE", entity: "job_plan", entityId: jobPlan.id, details: { input, savedRecord: jobPlan } });
    return NextResponse.json(jobPlan, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save job plan");
  }
}
