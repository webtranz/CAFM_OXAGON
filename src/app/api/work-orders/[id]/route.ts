import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { accessRole, canManageDepartmentRecord } from "@/lib/access-control";
import { auditAction } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  status: z.string().optional(),
  assetTag: z.string().optional(),
  jobPlan: z.string().optional(),
  safetyNotes: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  responseAt: z.string().optional(),
  resolutionAt: z.string().optional(),
  finishedAt: z.string().optional(),
  photoUrls: z.string().optional(),
  assetsUsed: z.string().optional(),
  inventoryUsed: z.string().optional(),
  supervisorRequest: z.string().optional(),
  workNotes: z.string().optional(),
  materialRequest: z.string().optional(),
  rejectionReason: z.string().optional(),
  supervisorDecision: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const current = await prisma.workOrder.findUnique({ where: { id } });
    if (!current) throw new Error("Work order not found");
    const user = await getCurrentUser();
    const role = accessRole(user);
    const isAssignedTechnician = role === "technician" && (current.assignedToId === user?.id || current.assignedTeamCode === user?.team?.code);
    const isSupervisorOrAdmin = canManageDepartmentRecord(user, current.departmentCode);
    if (!canManageDepartmentRecord(user, current.departmentCode) && !isAssignedTechnician) {
      return apiError(new Error("You do not have permission for this work order."), "Access denied", 403);
    }
    const priority = input.priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(input.priority) ? input.priority as any : undefined;
    const status = input.status && ["OPEN", "NEW", "TRIAGED", "APPROVED", "REJECTED", "PENDING_ASSIGNMENT", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "VERIFIED", "REOPENED", "CLOSED"].includes(input.status) ? input.status as any : undefined;
    const [asset] = await Promise.all([
      input.assetTag ? prisma.asset.findUnique({ where: { tag: input.assetTag } }) : null,
    ]);
    if (isAssignedTechnician && status && !["IN_PROGRESS", "ON_HOLD", "COMPLETED"].includes(status)) {
      return apiError(new Error("Service Team can only update status to In Progress, On Hold, or Completed."), "Access denied", 403);
    }
    if (isAssignedTechnician && (input.assignedTeamCode || input.assignedToEmail || input.departmentCode || input.priority || input.cost || input.supervisorDecision)) {
      return apiError(new Error("Service Team cannot assign, reassign, change priority, cost, or approve requests."), "Access denied", 403);
    }
    const updateData = isAssignedTechnician
      ? {
          status,
          responseAt: input.responseAt ? new Date(input.responseAt) : status === "IN_PROGRESS" ? new Date() : undefined,
          resolutionAt: input.resolutionAt ? new Date(input.resolutionAt) : status === "COMPLETED" ? new Date() : undefined,
          photoUrls: input.photoUrls,
          assetsUsed: input.assetsUsed,
          inventoryUsed: input.inventoryUsed,
          supervisorRequest: input.supervisorRequest,
          workNotes: input.workNotes,
          materialRequest: input.materialRequest,
          actualHours: status === "COMPLETED" ? 4 : undefined,
        }
      : {
          title: input.title,
          type: input.type,
          assetType: input.assetType,
          departmentCode: input.departmentCode,
          serviceCode: input.serviceCode,
          assignedTeamCode: input.assignedTeamCode,
          jobPlanCode: input.jobPlanCode,
          priority,
          status,
          assetId: asset?.id,
          assignedToId: input.assignedTeamCode ? null : undefined,
          jobPlan: input.jobPlan,
          safetyNotes: input.safetyNotes,
          estimatedHours: input.estimatedHours,
          cost: input.cost,
          responseAt: input.responseAt ? new Date(input.responseAt) : status === "IN_PROGRESS" ? new Date() : undefined,
          resolutionAt: input.resolutionAt ? new Date(input.resolutionAt) : status === "COMPLETED" ? new Date() : undefined,
          finishedAt: input.finishedAt ? new Date(input.finishedAt) : status === "CLOSED" ? new Date() : undefined,
          photoUrls: input.photoUrls,
          assetsUsed: input.assetsUsed,
          inventoryUsed: input.inventoryUsed,
          supervisorRequest: input.supervisorRequest,
          workNotes: input.workNotes,
          materialRequest: input.materialRequest,
          rejectionReason: input.rejectionReason,
          supervisorDecision: input.supervisorDecision,
          verifiedAt: status === "VERIFIED" || status === "CLOSED" ? new Date() : undefined,
          actualHours: status && ["COMPLETED", "VERIFIED", "CLOSED"].includes(status) ? 4 : undefined,
        };
    if (!isSupervisorOrAdmin && (status === "CLOSED" || status === "REOPENED")) {
      return apiError(new Error("Only Supervisor or Admin can close or reopen work orders."), "Access denied", 403);
    }
    const updated = await prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    if (updated.requestId && status === "CLOSED") {
      await prisma.serviceRequest.update({ where: { id: updated.requestId }, data: { status: "CLOSED" } });
    }
    await auditAction({ user, action: `WORK_ORDER_${status || "UPDATE"}`, entity: "work_order", entityId: id, details: input.materialRequest || input.supervisorDecision || input.workNotes });

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Unable to update work order");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = await prisma.workOrder.findUnique({ where: { id } });
    const user = await getCurrentUser();
    if (!canManageDepartmentRecord(user, current?.departmentCode)) {
      return apiError(new Error("You do not have permission to delete this work order."), "Access denied", 403);
    }
    await prisma.workOrder.delete({ where: { id } });
    await auditAction({ user, action: "WORK_ORDER_DELETE", entity: "work_order", entityId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete work order");
  }
}
