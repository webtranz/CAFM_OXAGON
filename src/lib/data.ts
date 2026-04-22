import { prisma } from "@/lib/prisma";
import { fallbackData } from "@/lib/demo-data";

export async function getOperatingData() {
  if (!process.env.DATABASE_URL) {
    return { ...fallbackData, live: false };
  }

  try {
    const [sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories, ppms, users, permissions, departments, employees, rolePermissions] = await Promise.all([
      prisma.site.findMany({ take: 6, orderBy: { name: "asc" } }),
      prisma.asset.findMany({
        take: 1000,
        orderBy: [{ tag: "asc" }],
        include: {
          site: { select: { name: true } },
          building: { select: { name: true, code: true } },
          history: { take: 8, orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.serviceRequest.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
      prisma.workOrder.findMany({
        take: 8,
        orderBy: { dueAt: "asc" },
        include: { assignedTo: { select: { name: true } }, asset: { select: { tag: true } } },
      }),
      prisma.inventoryItem.findMany({ take: 8, orderBy: { onHand: "asc" } }),
      prisma.inspection.findMany({ take: 6, orderBy: { dueAt: "asc" } }),
      prisma.iotAlert.findMany({ take: 6, orderBy: { detectedAt: "desc" } }),
      prisma.team.findMany({ take: 12, include: { services: true }, orderBy: { name: "asc" } }),
      prisma.serviceCatalog.findMany({ take: 12, include: { team: true }, orderBy: { name: "asc" } }),
      prisma.assetCategory.findMany({ take: 12, orderBy: { name: "asc" } }),
      prisma.preventiveMaintenance.findMany({ take: 12, orderBy: { nextDue: "asc" } }),
      prisma.user.findMany({ take: 20, include: { team: true }, orderBy: { name: "asc" } }),
      prisma.permission.findMany({ take: 50, orderBy: [{ module: "asc" }, { name: "asc" }] }),
      prisma.department.findMany({ take: 50, orderBy: { code: "asc" } }),
      prisma.employee.findMany({ take: 100, orderBy: { name: "asc" } }),
      prisma.rolePermission.findMany({ include: { permission: true }, orderBy: { role: "asc" } }),
    ]);

    return { sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories, ppms, users, permissions, departments, employees, rolePermissions, live: true };
  } catch {
    return { ...fallbackData, live: false };
  }
}
