import { prisma } from "@/lib/prisma";
import { fallbackData } from "@/lib/demo-data";

export async function getOperatingData() {
  if (!process.env.DATABASE_URL) {
    return { ...fallbackData, live: false };
  }

  try {
    const [sites, assets, requests, workOrders, inventory, inspections, alerts] = await Promise.all([
      prisma.site.findMany({ take: 6, orderBy: { name: "asc" } }),
      prisma.asset.findMany({ take: 8, orderBy: [{ criticality: "desc" }, { conditionScore: "asc" }] }),
      prisma.serviceRequest.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
      prisma.workOrder.findMany({
        take: 8,
        orderBy: { dueAt: "asc" },
        include: { assignedTo: { select: { name: true } }, asset: { select: { tag: true } } },
      }),
      prisma.inventoryItem.findMany({ take: 8, orderBy: { onHand: "asc" } }),
      prisma.inspection.findMany({ take: 6, orderBy: { dueAt: "asc" } }),
      prisma.iotAlert.findMany({ take: 6, orderBy: { detectedAt: "desc" } }),
    ]);

    return { sites, assets, requests, workOrders, inventory, inspections, alerts, live: true };
  } catch {
    return { ...fallbackData, live: false };
  }
}
