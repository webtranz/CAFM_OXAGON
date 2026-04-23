import { prisma } from "@/lib/prisma";
import { fallbackData } from "@/lib/demo-data";

export async function getOperatingData() {
  if (!process.env.DATABASE_URL) {
    return { ...fallbackData, live: false };
  }

  try {
    const [sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories, ppms, users, permissions, departments, employees, rolePermissions, locations, jobPlans, roles] = await Promise.all([
      prisma.site.findMany({ orderBy: { name: "asc" } }),
      prisma.asset.findMany({
        orderBy: [{ tag: "asc" }],
        include: {
          site: { select: { name: true } },
          building: { select: { name: true, code: true } },
          history: { take: 8, orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.serviceRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: { workOrder: { select: { id: true, woNo: true, status: true } } },
      }),
      prisma.workOrder.findMany({
        orderBy: { dueAt: "asc" },
        include: { assignedTo: { select: { name: true, email: true } }, asset: { select: { tag: true } } },
      }),
      prisma.inventoryItem.findMany({ orderBy: { sku: "asc" } }),
      prisma.inspection.findMany({ orderBy: { dueAt: "asc" } }),
      prisma.iotAlert.findMany({ orderBy: { detectedAt: "desc" } }),
      prisma.team.findMany({ include: { services: true }, orderBy: { name: "asc" } }),
      prisma.serviceCatalog.findMany({ include: { team: true }, orderBy: { name: "asc" } }),
      prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.preventiveMaintenance.findMany({ orderBy: { nextDue: "asc" } }),
      prisma.user.findMany({ include: { team: true }, orderBy: { name: "asc" } }),
      prisma.permission.findMany({ orderBy: [{ module: "asc" }, { name: "asc" }] }),
      prisma.department.findMany({ orderBy: { code: "asc" } }),
      prisma.employee.findMany({ orderBy: { name: "asc" } }),
      prisma.rolePermission.findMany({ include: { permission: true }, orderBy: { role: "asc" } }),
      prisma.location.findMany({ orderBy: [{ site: "asc" }, { building: "asc" }, { floor: "asc" }, { room: "asc" }] }),
      prisma.jobPlan.findMany({ orderBy: { code: "asc" } }),
      prisma.role.findMany({ orderBy: { name: "asc" } }),
    ]);

    return { sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories, ppms, users, permissions, departments, employees, rolePermissions, locations, jobPlans, roles, live: true };
  } catch {
    return { ...fallbackData, live: false };
  }
}
