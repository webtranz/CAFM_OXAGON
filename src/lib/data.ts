import { prisma } from "@/lib/prisma";
import { fallbackData } from "@/lib/demo-data";

type OperatingUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string | null;
  team?: { code: string } | null;
} | null;

function roleKind(user: OperatingUser) {
  const role = String(user?.role ?? "").toLowerCase();
  if (role === "admin" || role.includes("super admin")) return "admin";
  if (role.includes("supervisor")) return "supervisor";
  if (role.includes("technician") || role.includes("service team")) return "technician";
  if (role.includes("read") || role.includes("viewer") || role.includes("view only")) return "readonly";
  return "requester";
}

function departmentValues(user: OperatingUser) {
  return [user?.department, user?.department?.trim()].filter(Boolean) as string[];
}

export async function getOperatingData(user: OperatingUser = null) {
  if (!process.env.DATABASE_URL) {
    return { ...fallbackData, live: false };
  }

  try {
    const kind = roleKind(user);
    const departmentsForUser = departmentValues(user);
    const teamCode = user?.team?.code;
    const visibleAssetWhere =
      kind === "admin"
        ? {}
        : kind === "supervisor"
        ? { departmentCode: { in: departmentsForUser } }
        : kind === "technician"
        ? { OR: [{ assignedTeamCode: teamCode || "" }, { departmentCode: { in: departmentsForUser } }] }
        : {};
    const visibleRequestWhere =
      kind === "admin"
        ? {}
        : kind === "supervisor"
        ? { OR: [{ departmentCode: { in: departmentsForUser } }, { assignedSupervisorEmail: user?.email || "" }] }
        : kind === "technician"
        ? { OR: [{ assignedTeamCode: teamCode || "" }, { assignedSupervisorEmail: user?.email || "" }] }
        : { requester: user?.name || user?.email || "" };
    const visibleWorkWhere =
      kind === "admin"
        ? {}
        : kind === "supervisor"
        ? { departmentCode: { in: departmentsForUser } }
        : kind === "technician"
        ? { OR: [{ assignedToId: user?.id || "" }, { assignedTeamCode: teamCode || "" }] }
        : { assignedToId: "__none__" };
    const visibleJobPlanWhere = kind === "admin" ? {} : kind === "supervisor" || kind === "technician" ? { departmentCode: { in: departmentsForUser } } : {};
    const visibleUsersWhere = kind === "admin" ? {} : { OR: [{ department: { in: departmentsForUser } }, { id: user?.id || "" }] };

    const [sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories, ppms, users, permissions, departments, employees, rolePermissions, locations, jobPlans, roles, auditLogs] = await Promise.all([
      prisma.site.findMany({ orderBy: { name: "asc" } }),
      prisma.asset.findMany({
        where: visibleAssetWhere,
        orderBy: [{ tag: "asc" }],
        include: {
          site: { select: { name: true } },
          building: { select: { name: true, code: true } },
          workOrders: { take: 8, orderBy: { updatedAt: "desc" }, select: { woNo: true, title: true, status: true, updatedAt: true, inventoryUsed: true, workNotes: true } },
          history: { take: 8, orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.serviceRequest.findMany({
        where: visibleRequestWhere,
        orderBy: { createdAt: "desc" },
        include: { workOrder: { select: { id: true, woNo: true, status: true } } },
      }),
      prisma.workOrder.findMany({
        where: visibleWorkWhere,
        orderBy: { dueAt: "asc" },
        include: {
          assignedTo: { select: { name: true, email: true } },
          asset: { select: { tag: true, name: true, assetDescription: true, buildingCode: true, floor: true, room: true } },
          inventoryIssues: { include: { item: { select: { sku: true, name: true, unit: true } } }, orderBy: { issuedAt: "desc" } },
          request: { select: { ticketNo: true, title: true, description: true, requester: true, attachmentUrls: true, location: true, category: true, createdAt: true } },
        },
      }),
      prisma.inventoryItem.findMany({ orderBy: { sku: "asc" } }),
      prisma.inspection.findMany({ orderBy: { dueAt: "asc" } }),
      prisma.iotAlert.findMany({ orderBy: { detectedAt: "desc" } }),
      prisma.team.findMany({ include: { services: true }, orderBy: { name: "asc" } }),
      prisma.serviceCatalog.findMany({ include: { team: true }, orderBy: { name: "asc" } }),
      prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.preventiveMaintenance.findMany({ orderBy: { nextDue: "asc" } }),
      prisma.user.findMany({ where: visibleUsersWhere, include: { team: true }, orderBy: { name: "asc" } }),
      prisma.permission.findMany({ orderBy: [{ module: "asc" }, { name: "asc" }] }),
      prisma.department.findMany({ orderBy: { code: "asc" } }),
      prisma.employee.findMany({ where: kind === "admin" ? {} : { departmentCode: { in: departmentsForUser } }, orderBy: { name: "asc" } }),
      prisma.rolePermission.findMany({ include: { permission: true }, orderBy: { role: "asc" } }),
      prisma.location.findMany({ orderBy: [{ site: "asc" }, { building: "asc" }, { floor: "asc" }, { room: "asc" }] }),
      prisma.jobPlan.findMany({ where: visibleJobPlanWhere, orderBy: { code: "asc" } }),
      prisma.role.findMany({ orderBy: { name: "asc" } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    ]);

    const visibleAssetTags = new Set(assets.map((asset) => asset.tag));
    const scopedPpms = kind === "admin" ? ppms : ppms.filter((ppm) => visibleAssetTags.has(ppm.assetTag));

    return { sites, assets, requests, workOrders, inventory, inspections, alerts, teams, services, categories, ppms: scopedPpms, users, permissions, departments, employees, rolePermissions, locations, jobPlans, roles, auditLogs, live: true };
  } catch {
    return { ...fallbackData, live: false };
  }
}
