import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workOrderKpis, workOrderMetrics } from "@/lib/work-order-analytics";

type ReportRow = Record<string, string | number | boolean | null>;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "assets";
  const format = url.searchParams.get("format") || "preview";
  const filters = reportFilters(url);
  const rows = await reportRows(type, filters);
  const kpis = type === "work-orders" ? workOrderKpis(rows) : null;

  if (format === "csv") {
    return file(csv(rows), "text/csv", `${type}.csv`);
  }
  if (format === "excel") {
    return file(excel(rows, type, kpis), "application/vnd.ms-excel", `${type}.xls`);
  }
  if (format === "pdf") {
    return file(pdf(rows, type, kpis, filters), "application/pdf", `${type}.pdf`);
  }
  if (format === "html") {
    return html(htmlPreview(rows, type, kpis, filters));
  }
  return NextResponse.json({ type, rows, kpis, filters });
}

function reportFilters(url: URL) {
  return {
    responseGreaterThan: numberParam(url, "responseGreaterThan"),
    resolutionGreaterThan: numberParam(url, "resolutionGreaterThan"),
    slaBreach: url.searchParams.get("slaBreach"),
    delayedOnly: url.searchParams.get("delayedOnly") === "true",
  };
}

function numberParam(url: URL, key: string) {
  const value = url.searchParams.get(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function reportRows(type: string, filters: ReturnType<typeof reportFilters>): Promise<ReportRow[]> {
  if (type === "work-orders") {
    const rows = await prisma.workOrder.findMany({
      include: { asset: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
    });
    return rows
      .map((row) => workOrderMetrics(row))
      .filter((row) => {
        if (filters.responseGreaterThan !== null && Number(row.response_duration_mins ?? -1) <= filters.responseGreaterThan) return false;
        if (filters.resolutionGreaterThan !== null && Number(row.response_to_resolution_mins ?? -1) <= filters.resolutionGreaterThan) return false;
        if (filters.slaBreach === "yes" && !row.sla_breached) return false;
        if (filters.slaBreach === "no" && row.sla_breached) return false;
        if (filters.delayedOnly && !row.delayed) return false;
        return true;
      });
  }
  if (type === "requests") {
    const rows = await prisma.serviceRequest.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({
      ticketNo: row.ticketNo,
      title: row.title,
      category: row.category,
      departmentCode: row.departmentCode,
      serviceCode: row.serviceCode,
      assignedTeamCode: row.assignedTeamCode,
      supervisor: row.assignedSupervisorEmail,
      requester: row.requester,
      priority: row.priority,
      status: row.status,
      location: row.location,
      dueAt: dateValue(row.dueAt),
      createdAt: dateValue(row.createdAt),
    }));
  }
  if (type === "inventory") {
    const rows = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => ({ sku: row.sku, name: row.name, category: row.category, unit: row.unit, onHand: row.onHand, reorderPoint: row.reorderPoint, unitCost: Number(row.unitCost), vendor: row.vendor, location: row.location }));
  }
  if (type === "ppm") {
    const rows = await prisma.preventiveMaintenance.findMany({ orderBy: { nextDue: "asc" } });
    return rows.map((row) => ({ code: row.code, name: row.name, assetTag: row.assetTag, frequency: row.frequency, nextDue: dateValue(row.nextDue), durationHrs: Number(row.durationHrs), checklist: row.checklist, active: row.active }));
  }
  if (type === "employees") {
    const rows = await prisma.employee.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => ({ name: row.name, email: row.email, companyId: row.companyId, nationalityType: row.nationalityType, departmentCode: row.departmentCode, siteLocation: row.siteLocation, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "users") {
    const rows = await prisma.user.findMany({ include: { team: true }, orderBy: { name: "asc" } });
    return rows.map((row) => ({ name: row.name, email: row.email, phone: row.phone, role: row.role, department: row.department, teamCode: row.team?.code ?? "", teamName: row.team?.name ?? "", active: row.active, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "permissions") {
    const rows = await prisma.rolePermission.findMany({ include: { permission: true }, orderBy: [{ role: "asc" }] });
    return rows.map((row) => ({ role: row.role, permissionCode: row.permission.code, permission: row.permission.name, module: row.permission.module, description: row.permission.description }));
  }
  if (type === "departments") {
    const rows = await prisma.department.findMany({ orderBy: { code: "asc" } });
    return rows.map((row) => ({ code: row.code, name: row.name, siteLocation: row.siteLocation, description: row.description, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "teams") {
    const rows = await prisma.team.findMany({ orderBy: { code: "asc" } });
    return rows.map((row) => ({ code: row.code, name: row.name, type: row.type, supervisor: row.supervisor, phone: row.phone, email: row.email, shift: row.shift, coverage: row.coverage, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "services") {
    const rows = await prisma.serviceCatalog.findMany({ include: { team: true }, orderBy: { code: "asc" } });
    return rows.map((row) => ({ code: row.code, name: row.name, category: row.category, type: row.type, priority: row.priority, slaHours: row.slaHours, teamCode: row.team?.code ?? "", teamName: row.team?.name ?? "", active: row.active, description: row.description, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "asset-categories") {
    const rows = await prisma.assetCategory.findMany({ orderBy: { code: "asc" } });
    return rows.map((row) => ({ code: row.code, name: row.name, type: row.type, defaultLifeYrs: row.defaultLifeYrs, statutory: row.statutory, description: row.description, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "locations") {
    const rows = await prisma.location.findMany({ orderBy: { code: "asc" } });
    return rows.map((row) => ({ code: row.code, site: row.site, zone: row.zone, building: row.building, floor: row.floor, room: row.room, type: row.type, description: row.description, active: row.active, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "job-plans") {
    const rows = await prisma.jobPlan.findMany({ orderBy: { code: "asc" } });
    return rows.map((row) => ({ code: row.code, name: row.name, assetType: row.assetType, departmentCode: row.departmentCode, serviceCode: row.serviceCode, estimatedHours: Number(row.estimatedHours), priority: row.priority, steps: row.steps, safetyNotes: row.safetyNotes, active: row.active, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "inspections") {
    const rows = await prisma.inspection.findMany({ orderBy: { dueAt: "asc" } });
    return rows.map((row) => ({ code: row.code, title: row.title, area: row.area, inspector: row.inspector, risk: row.risk, score: row.score, status: row.status, dueAt: dateValue(row.dueAt), findings: row.findings }));
  }
  if (type === "iot-alerts") {
    const rows = await prisma.iotAlert.findMany({ orderBy: { detectedAt: "desc" } });
    return rows.map((row) => ({ source: row.source, assetTag: row.assetTag, severity: row.severity, message: row.message, status: row.status, detectedAt: dateValue(row.detectedAt) }));
  }
  if (type === "housing-dashboard") {
    const [rooms, bookings, inspections, assets, inventory, approvals, notifications] = await Promise.all([
      prisma.housingRoom.findMany({ include: { property: true, block: true } }),
      prisma.housingBooking.findMany({ include: { room: { include: { property: true, block: true } }, resident: true } }),
      prisma.housingInspection.findMany({ include: { room: { include: { property: true, block: true } } } }),
      prisma.housingAsset.findMany({ include: { room: { include: { property: true, block: true } } } }),
      prisma.housingInventory.findMany({ include: { room: { include: { property: true, block: true } } } }),
      prisma.housingApproval.findMany(),
      prisma.housingNotification.findMany(),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const capacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupancy = rooms.reduce((sum, room) => sum + room.occupancy, 0);
    const metricRows: ReportRow[] = [
      { section: "Summary", metric: "Total available rooms", value: rooms.filter((room) => room.status === "AVAILABLE").length, detail: "Rooms ready for allocation" },
      { section: "Summary", metric: "Total occupied rooms", value: rooms.filter((room) => room.status === "OCCUPIED" || room.occupancy >= room.capacity).length, detail: "Rooms currently occupied" },
      { section: "Summary", metric: "Total vacant rooms", value: rooms.filter((room) => room.status === "AVAILABLE" && room.occupancy === 0).length, detail: "Vacant rooms" },
      { section: "Summary", metric: "Total blocked rooms", value: rooms.filter((room) => room.status === "BLOCKED").length, detail: "Blocked rooms" },
      { section: "Summary", metric: "Total under-maintenance rooms", value: rooms.filter((room) => room.status === "MAINTENANCE").length, detail: "Rooms under maintenance" },
      { section: "Summary", metric: "Total check-ins today", value: bookings.filter((booking) => dateValue(booking.checkIn).slice(0, 10) === today).length, detail: today },
      { section: "Summary", metric: "Total check-outs today", value: bookings.filter((booking) => dateValue(booking.checkOut).slice(0, 10) === today).length, detail: today },
      { section: "Summary", metric: "Bed occupancy percentage", value: capacity ? Math.round((occupancy / capacity) * 100) : 0, detail: `${occupancy}/${capacity} beds occupied` },
      { section: "Summary", metric: "Ticket summary", value: bookings.filter((booking) => ["REQUESTED", "PENDING_APPROVAL"].includes(booking.status)).length + inspections.filter((inspection) => inspection.status === "FAILED").length, detail: "Open booking requests and inspection findings" },
      { section: "Summary", metric: "Asset status summary", value: assets.length, detail: "Housing assets tracked" },
      { section: "Summary", metric: "Housekeeping status summary", value: inspections.filter((inspection) => inspection.inspectionType.toLowerCase().includes("housekeeping") && !["PASSED", "CLOSED"].includes(inspection.status)).length, detail: "Open housekeeping checks" },
      { section: "Summary", metric: "Pending approvals summary", value: approvals.filter((approval) => approval.status === "PENDING").length, detail: "Awaiting approval" },
      { section: "Summary", metric: "Safety observations and incidents summary", value: inspections.filter((inspection) => inspection.status === "FAILED" || inspection.score < 80).length + notifications.filter((notification) => ["HIGH", "CRITICAL"].includes(notification.severity)).length, detail: "Open safety observations or high alerts" },
      { section: "Inventory", metric: "Housing inventory items", value: inventory.length, detail: "Inventory SKUs in housing" },
    ];
    const buildingRows = Array.from(rooms.reduce((map, room) => {
      const key = room.block?.name ?? room.property.name;
      const current = map.get(key) ?? { capacity: 0, occupancy: 0, rooms: 0 };
      current.capacity += room.capacity;
      current.occupancy += room.occupancy;
      current.rooms += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { capacity: number; occupancy: number; rooms: number }>()).entries()).map(([building, values]) => ({
      section: "Building-wise occupancy",
      metric: building,
      value: values.capacity ? Math.round((values.occupancy / values.capacity) * 100) : 0,
      detail: `${values.occupancy}/${values.capacity} beds, ${values.rooms} rooms`,
    }));
    const categoryRows = Array.from(rooms.reduce((map, room) => {
      const current = map.get(room.roomType) ?? { capacity: 0, occupancy: 0, rooms: 0 };
      current.capacity += room.capacity;
      current.occupancy += room.occupancy;
      current.rooms += 1;
      map.set(room.roomType, current);
      return map;
    }, new Map<string, { capacity: number; occupancy: number; rooms: number }>()).entries()).map(([category, values]) => ({
      section: "Room category occupancy",
      metric: category,
      value: values.capacity ? Math.round((values.occupancy / values.capacity) * 100) : 0,
      detail: `${values.occupancy}/${values.capacity} beds, ${values.rooms} rooms`,
    }));
    const companyRows = Array.from(bookings.reduce((map, booking) => {
      const key = booking.resident?.companyId || booking.departmentCode || "Unassigned";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries()).map(([company, count]) => ({
      section: "Company-wise occupancy",
      metric: company,
      value: count,
      detail: "Active or requested housing bookings",
    }));
    return [...metricRows, ...companyRows, ...buildingRows, ...categoryRows];
  }
  if (type === "housing-rooms") {
    const rows = await prisma.housingRoom.findMany({ include: { property: true, block: true, beds: true }, orderBy: { roomNumber: "asc" } });
    return rows.map((row) => ({ code: row.code, property: row.property.name, block: row.block?.name ?? "", floor: row.floor, roomNumber: row.roomNumber, roomType: row.roomType, genderRestriction: row.genderRestriction, capacity: row.capacity, occupancy: row.occupancy, status: row.status, qrCode: row.qrCode, remarks: row.remarks, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "housing-bookings") {
    const rows = await prisma.housingBooking.findMany({ include: { room: { include: { property: true, block: true } }, bed: true, resident: true }, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ bookingNo: row.bookingNo, employeeId: row.employeeId ?? row.resident?.residentNo ?? "", employeeName: row.residentName, companyName: row.companyName ?? row.resident?.companyName ?? "", department: row.departmentCode, nationality: row.nationality ?? row.resident?.nationality ?? "", contactNumber: row.contactNumber ?? row.resident?.phone ?? "", gender: row.gender ?? row.resident?.gender ?? "", buildingNumber: row.buildingNumber ?? row.room.block?.name ?? "", floorNumber: row.floorNumber ?? row.room.floor, roomNumber: row.roomNumber ?? row.room.roomNumber, bedNumber: row.bedNumber ?? row.bed?.label ?? "", bookingType: row.bookingType, allocationType: row.allocationType, property: row.room.property.name, block: row.room.block?.name ?? "", checkIn: dateValue(row.checkIn), checkOut: dateValue(row.checkOut), status: row.status, priority: row.priority, requestedBy: row.requestedBy, approvedBy: row.approvedBy, approvalLevel: row.approvalLevel, keyHandoverBy: row.keyHandoverBy, keyHandoverAt: dateValue(row.keyHandoverAt), campIdNumber: row.campIdNumber, campIdIssuedAt: dateValue(row.campIdIssuedAt), cancellationReason: row.cancellationReason, transferReason: row.transferReason, blacklistReason: row.blacklistReason, noShowAt: dateValue(row.noShowAt), notes: row.notes }));
  }
  if (type === "housing-inspections") {
    const rows = await prisma.housingInspection.findMany({ include: { room: { include: { property: true, block: true } } }, orderBy: { dueAt: "asc" } });
    return rows.map((row) => ({
      inspectionNo: row.inspectionNo,
      property: row.room.property.name,
      block: row.room.block?.name ?? "",
      floor: row.room.floor,
      room: row.room.roomNumber,
      bedId: row.bedId,
      occupant: row.occupantName,
      assetId: row.assetId,
      workOrderRef: row.workOrderRef,
      inspector: row.inspector,
      inspectionType: row.inspectionType,
      status: row.status,
      score: row.score,
      furnitureCondition: row.furnitureCondition,
      mattressCondition: row.mattressCondition,
      bedSheetCondition: row.bedSheetCondition,
      tvCondition: row.tvCondition,
      refrigeratorCondition: row.refrigeratorCondition,
      acCondition: row.acCondition,
      waterLeakageCheck: row.waterLeakageCheck,
      lightingCondition: row.lightingCondition,
      curtainCondition: row.curtainCondition,
      doorLockCondition: row.doorLockCondition,
      smokeDetectorCondition: row.smokeDetectorCondition,
      fireExtinguisherAvailability: row.fireExtinguisherAvailability,
      bathroomCleanliness: row.bathroomCleanliness,
      generalRoomCleanliness: row.generalRoomCleanliness,
      missingAssetVerification: row.missingAssetVerification,
      damageFound: row.damageFound,
      damageReport: row.damageReport,
      missingAssetFound: row.missingAssetFound,
      missingAssetReport: row.missingAssetReport,
      repairRequired: row.repairRequired,
      estimatedRepairCost: Number(row.estimatedRepairCost),
      occupantLiability: row.occupantLiability,
      maintenanceTicketNo: row.maintenanceTicketNo,
      dueAt: dateValue(row.dueAt),
      completedAt: dateValue(row.completedAt),
      beforePhotoUrls: row.beforePhotoUrls,
      afterPhotoUrls: row.afterPhotoUrls,
      findings: row.findings,
    }));
  }
  if (type === "housing-assets") {
    const rows = await prisma.housingAsset.findMany({ include: { room: { include: { property: true, block: true } } }, orderBy: { tag: "asc" } });
    return rows.map((row) => ({
      assetCode: row.tag,
      barcodeQrCode: row.qrCode,
      description: row.description ?? row.name,
      category: row.category,
      serialNumber: row.serialNumber,
      brand: row.brand,
      model: row.model,
      purchaseDate: dateValue(row.purchaseDate),
      warrantyExpiry: dateValue(row.warrantyExpiry),
      supplierName: row.supplierName,
      assetValue: Number(row.assetValue),
      currentValue: Number(row.currentValue),
      depreciationRate: Number(row.depreciationRate),
      property: row.room?.property.name ?? "",
      buildingLocation: row.buildingLocation ?? row.room?.block?.name ?? "",
      roomLocation: row.roomLocation ?? row.room?.roomNumber ?? "",
      room: row.room?.roomNumber ?? "",
      status: row.status,
      custodianName: row.custodianName,
      custodianContact: row.custodianContact,
      issuedTo: row.issuedTo,
      issuedAt: dateValue(row.issuedAt),
      transferredFrom: row.transferredFrom,
      transferredTo: row.transferredTo,
      transferredAt: dateValue(row.transferredAt),
      replacementOf: row.replacementOf,
      replacedAt: dateValue(row.replacedAt),
      pmSchedule: row.pmSchedule,
      nextPmDue: dateValue(row.nextPmDue),
      lastInspectionAt: dateValue(row.lastInspectionAt),
      missingOrDamaged: ["MISSING", "DAMAGED"].includes(String(row.status).toUpperCase()),
    }));
  }
  if (type === "housing-inventory") {
    const rows = await prisma.housingInventory.findMany({ include: { room: { include: { property: true, block: true } } }, orderBy: { sku: "asc" } });
    return rows.map((row) => ({ sku: row.sku, name: row.name, category: row.category, property: row.room?.property.name ?? "", block: row.room?.block?.name ?? "", room: row.room?.roomNumber ?? "", onHand: row.onHand, reorderPoint: row.reorderPoint, unit: row.unit, qrCode: row.qrCode }));
  }
  if (type === "housing-approvals") {
    const rows = await prisma.housingApproval.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ entity: row.entity, entityId: row.entityId, step: row.step, level: row.level, approver: row.approver, status: row.status, action: row.action, approverName: row.approverName, remarks: row.remarks, actedAt: dateValue(row.actedAt), createdAt: dateValue(row.createdAt), updatedAt: dateValue(row.updatedAt) }));
  }
  if (type === "housing-notifications") {
    const rows = await prisma.housingNotification.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ title: row.title, message: row.message, severity: row.severity, recipient: row.recipient, read: row.read, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "housing-history") {
    const rows = await prisma.housingHistory.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
    return rows.map((row) => ({ entity: row.entity, entityId: row.entityId, action: row.action, actor: row.actor, details: row.details, createdAt: dateValue(row.createdAt) }));
  }
  if (type === "audit-logs") {
    const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
    return rows.map((row) => ({ time: dateValue(row.createdAt), actorName: row.actorName, role: row.role, action: row.action, entity: row.entity, entityId: row.entityId, details: row.details }));
  }
  const rows = await prisma.asset.findMany({ include: { building: true, site: true }, orderBy: { tag: "asc" } });
  return rows.map((row) => ({
    tag: row.tag,
    name: row.name,
    assetDescription: row.assetDescription,
    category: row.category,
    assetGroup: row.assetGroup,
    system: row.system,
    status: row.status,
    site: row.site?.name ?? row.siteCode ?? "",
    zone: row.zone ?? "",
    building: row.building?.name ?? row.buildingCode ?? "",
    floor: row.floor ?? "",
    room: row.room ?? "",
    departmentCode: row.departmentCode ?? "",
    parentAsset: row.parentAsset ?? "",
    serialNumber: row.serialNumber,
    manufacturer: row.manufacturer,
    model: row.model,
    condition: row.conditionScore,
    cost: Number(row.purchaseCost),
  }));
}

function dateValue(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function csv(rows: ReportRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => quote(row[header])).join(","))].join("\n");
}

function excel(rows: ReportRow[], title: string, kpis: Record<string, unknown> | null) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return `<html><body><h1>${escapeHtml(title)}</h1>${kpiHtml(kpis)}<table border="1"><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
}

function htmlPreview(rows: ReportRow[], title: string, kpis: Record<string, unknown> | null, filters: ReturnType<typeof reportFilters>) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const filterText = `Response > ${filters.responseGreaterThan ?? "-"} mins | Resolution > ${filters.resolutionGreaterThan ?? "-"} mins | SLA: ${filters.slaBreach ?? "all"} | Delayed: ${filters.delayedOnly ? "yes" : "no"}`;
  const table = rows.length
    ? `<div class="table-wrap"><table><thead><tr><th>#</th>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : `<div class="empty">No records found for this report.</div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} Report</title>
  <style>
    :root { color-scheme: light; --ink:#111827; --muted:#64748b; --line:#dbe7ef; --soft:#f4f8fb; --lagoon:#0f8b8d; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, Helvetica, sans-serif; color:var(--ink); background:#eef6f6; }
    header { padding:24px 28px; background:linear-gradient(90deg,#c026d3,#4f46e5); color:white; }
    h1 { margin:0; font-size:28px; letter-spacing:0; }
    .meta { margin-top:8px; color:rgba(255,255,255,.82); font-size:13px; font-weight:700; }
    main { padding:22px; }
    .toolbar, .kpis, .table-wrap, .empty { border:1px solid var(--line); background:white; border-radius:8px; box-shadow:0 12px 30px rgba(15,23,42,.07); }
    .toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; padding:12px; margin-bottom:16px; }
    .actions { display:flex; flex-wrap:wrap; gap:8px; }
    a, button { border:0; border-radius:8px; padding:10px 13px; font-size:13px; font-weight:800; text-decoration:none; cursor:pointer; }
    a { background:var(--lagoon); color:white; }
    button { background:#111827; color:white; }
    .kpis { display:grid; gap:10px; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); padding:12px; margin-bottom:16px; }
    .kpi { background:var(--soft); border-radius:8px; padding:12px; }
    .kpi span { display:block; color:var(--muted); font-size:11px; font-weight:900; text-transform:uppercase; }
    .kpi strong { display:block; margin-top:6px; font-size:18px; }
    .table-wrap { overflow:auto; }
    table { width:100%; min-width:900px; border-collapse:collapse; }
    th, td { border-bottom:1px solid #e8eef3; padding:11px 12px; text-align:left; vertical-align:top; font-size:13px; white-space:nowrap; }
    th { position:sticky; top:0; background:#f8fafc; color:#475569; text-transform:uppercase; font-size:11px; }
    tr:nth-child(even) td { background:#fbfdff; }
    .empty { padding:24px; color:var(--muted); font-weight:800; }
    @media print { header, .toolbar { box-shadow:none; } .actions, button { display:none; } body { background:white; } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(prettyTitle(title))} Report Preview</h1>
    <div class="meta">Generated ${escapeHtml(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }))} | ${rows.length} records</div>
  </header>
  <main>
    <div class="toolbar">
      <div><strong>Filters</strong><br /><span style="color:var(--muted);font-size:13px">${escapeHtml(filterText)}</span></div>
      <div class="actions">
        <a href="/api/reports?type=${encodeURIComponent(title)}&format=csv">CSV</a>
        <a href="/api/reports?type=${encodeURIComponent(title)}&format=excel">Excel</a>
        <a href="/api/reports?type=${encodeURIComponent(title)}&format=pdf">PDF</a>
        <button onclick="window.print()">Print</button>
      </div>
    </div>
    ${kpiHtml(kpis, "div")}
    ${table}
  </main>
</body>
</html>`;
}

function pdf(rows: ReportRow[], title: string, kpis: Record<string, unknown> | null, filters: ReturnType<typeof reportFilters>) {
  const kpiLines = kpis ? Object.entries(kpis).map(([key, value]) => `${key}: ${value ?? "-"}`) : [];
  const filterLines = [`Filters: response>${filters.responseGreaterThan ?? "-"} mins, resolution>${filters.resolutionGreaterThan ?? "-"} mins, sla=${filters.slaBreach ?? "all"}, delayed=${filters.delayedOnly ? "yes" : "no"}`];
  const lines = [`Tamimi Global CAFM Report: ${title}`, `Generated: ${new Date().toISOString()}`, ...filterLines, ...kpiLines, "", ...rows.slice(0, 35).map((row) => Object.values(row).join(" | "))];
  const text = lines.join("\\n").replace(/[()\\]/g, "");
  return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>endobj
4 0 obj<</Length ${text.length + 64}>>stream
BT /F1 9 Tf 40 760 Td (${text}) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
trailer<</Root 1 0 R/Size 6>>
startxref
0
%%EOF`;
}

function kpiHtml(kpis: Record<string, unknown> | null, mode: "list" | "div" = "list") {
  if (!kpis) return "";
  if (mode === "div") {
    return `<section class="kpis">${Object.entries(kpis).map(([key, value]) => `<div class="kpi"><span>${escapeHtml(key.replaceAll("_", " "))}</span><strong>${escapeHtml(value ?? "-")}</strong></div>`).join("")}</section>`;
  }
  return `<h2>KPI Summary</h2><ul>${Object.entries(kpis).map(([key, value]) => `<li>${escapeHtml(key)}: ${escapeHtml(value ?? "-")}</li>`).join("")}</ul>`;
}

function quote(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function prettyTitle(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function file(body: string, contentType: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function html(body: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
