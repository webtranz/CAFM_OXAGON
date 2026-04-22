import { prisma } from "@/lib/prisma";
import { fallbackData } from "@/lib/demo-data";

export async function getOperatingData() {
  if (!process.env.DATABASE_URL) {
    return { ...fallbackData, live: false };
  }

  try {
    const [sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories] = await Promise.all([
      prisma.site.findMany({ take: 6, orderBy: { name: "asc" } }),
      prisma.asset.findMany({
        take: 12,
        orderBy: [{ criticality: "desc" }, { conditionScore: "asc" }],
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
    ]);

    return { sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories, live: true };
  } catch {
    return { ...fallbackData, live: false };
  }
}
