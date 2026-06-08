import { NextResponse } from "next/server";
import { addDays, addHours, addYears } from "date-fns";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { csvResponse, parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

type Row = Record<string, string>;

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("assets.manage");
    if (error) return error;
    const formData = await request.formData();
    const module = String(formData.get("module") || "");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError(new Error("CSV file is required."), "CSV file is required", 400);
    }

    const rows = parseCsv(await file.text());
    const failed: Array<{ row: number; message: string }> = [];
    let created = 0;

    for (const [index, row] of rows.entries()) {
      try {
        await importRow(module, row);
        created += 1;
      } catch (error) {
        failed.push({ row: index + 2, message: error instanceof Error ? error.message : "Import failed" });
      }
    }

    const result = csvResponse(created, failed);
    await auditAction({
      user,
      action: "BULK_UPLOAD",
      entity: "bulk_upload",
      entityId: module || "unknown",
      details: {
        module,
        fileName: file.name,
        fileSize: file.size,
        totalRows: rows.length,
        created,
        failed,
        result,
      },
    });
    return NextResponse.json(result, { status: failed.length ? 207 : 201 });
  } catch (error) {
    return apiError(error, "Bulk upload failed");
  }
}

async function importRow(module: string, row: Row) {
  if (module === "assets") return importAsset(row);
  if (module === "inventory") return importInventory(row);
  if (module === "requests") return importRequest(row);
  if (module === "workOrders") return importWorkOrder(row);
  if (module === "teams") return importTeam(row);
  if (module === "services") return importService(row);
  if (module === "departments") return importDepartment(row);
  if (module === "employees") return importEmployee(row);
  if (module === "categories") return importCategory(row);
  if (module === "inspections") return importInspection(row);
  if (module === "locations") return importLocation(row);
  if (module === "jobPlans") return importJobPlan(row);
  throw new Error(`Unsupported module: ${module}`);
}

async function firstSite() {
  const site = await prisma.site.findFirst({ include: { buildings: { take: 1 } } });
  if (!site) throw new Error("No site found. Seed or create a site first.");
  return site;
}

async function importAsset(row: Row) {
  const site = await firstSite();
  const tag = value(row, "EQUIPMENTNO", "tag", "ASSET NUMBER", "assetNumber", "Asset Code");
  if (!tag) throw new Error("EQUIPMENTNO is required");
  const locationCode = value(row, "LOCATION", "Location", "Location Name", "location", "ROOM", "room");
  const location = locationCode ? await prisma.location.findUnique({ where: { code: locationCode } }) : null;
  const name = value(row, "EQUIPMENTDESC", "name", "Asset Name", "Asset Description", "Asset Description ", "assetDescription") || tag;
  const description = value(row, "ADDITIONAL_NOTE", "Description", "Additional description", "additionalDescription");
  const category = value(row, "CATEGORY", "category", "Asset Type", "Asset Group", "Asset Group ", "assetGroup") || "General";
  const system = value(row, "PRIMARYSYSTEM", "system", "Entity Name", "Asset Type") || category;
  const floor = value(row, "floor", "FLOOR") || location?.floor || "Unassigned";
  const room = locationCode || value(row, "room", "ROOM", "ROOM ") || location?.code || "Unassigned";
  const departmentCode = value(row, "DEPARTMENT", "departmentCode", "Department", "Assigned To") || "";
  const cost = number(value(row, "EQUIPMENTVALUE", "purchaseCost", "Purchase Cost"), 0);
  const replacementCost = number(value(row, "replacementCost", "Replacement Cost"), cost);
  const lifeMonths = integer(value(row, "SERVICELIFE", "Life Expectancy (in months)", "lifeExpectancyMonths"), 96);
  const installDate = date(value(row, "COMMISSIONDATE", "installDate", "Purchase Date"), new Date());
  const outOfService = yesNo(value(row, "OUTOFSERVICE", "outOfService"), false);
  const status = outOfService ? "RETIRED" : assetStatusFromImport(value(row, "ASSETSTATUS", "status"));
  const documentationUrl = [value(row, "documentationUrl", "URL 1"), value(row, "URL 2")].filter(Boolean).join("\n") || null;
  const remarks = [
    value(row, "remarks", "Remarks"),
    value(row, "Vendors") ? `Vendors: ${value(row, "Vendors")}` : "",
    value(row, "Parts") ? `Parts: ${value(row, "Parts")}` : "",
    replacementCost ? `Replacement Cost: SAR ${replacementCost}` : "",
  ].filter(Boolean).join("\n");
  const assetData = {
    name,
    category,
    system,
    eqType: value(row, "EQTYPE") || "ASSET",
    organization: value(row, "ORGANIZATION") || null,
    criticality: priority(row.criticality),
    status,
    assetStatusText: value(row, "ASSETSTATUS") || status,
    serialNumber: value(row, "SERIALNUMBER", "serialNumber", "Serial No.") || `${tag}-SN`,
    siteCode: value(row, "siteCode", "SITE") || location?.site || "",
    zone: value(row, "zone", "ZONE") || location?.parentLocation || "",
    buildingCode: value(row, "buildingCode", "BLDG") || location?.building || "",
    assetGroup: value(row, "CLASS", "classCode") || category,
    assetDescription: name,
    additionalDescription: description,
    departmentDesc: value(row, "DEPARTMENT_DESC") || null,
    classCode: value(row, "CLASS") || null,
    classDesc: value(row, "CLASS_DESC") || null,
    categoryDesc: value(row, "CATEGORY_DESC") || null,
    gsrc: value(row, "GSRC") || null,
    attribute: value(row, "ATTRIBUTE") || null,
    environment: value(row, "ENVIRONMENT") || null,
    pressureBar: value(row, "PRESSURE_BAR") || null,
    flowLps: value(row, "FLOW_LPS") || null,
    supplyVoltageVolt: value(row, "SUPPLY_VOLTAGE_Volt") || null,
    outOfService,
    serviceLife: value(row, "SERVICELIFE") || null,
    locationCode: locationCode || null,
    locationDesc: value(row, "LOCATION_DESC") || location?.description || null,
    position: value(row, "POSITION") || null,
    classOrganization: value(row, "CLASSORGANIZATION") || null,
    primarySystem: value(row, "PRIMARYSYSTEM") || null,
    additionalNote: value(row, "ADDITIONAL_NOTE") || null,
    parentAsset: value(row, "parentAsset", "Parent Asset", "Parent Asset ") || "TOP LEVEL",
    departmentCode,
    assignedTeamCode: value(row, "assignedTeamCode", "Assigned Team", "Team Code"),
    assignedSupervisorEmail: value(row, "assignedSupervisorEmail", "Supervisor", "Supervisor Email"),
    remarks,
    manufacturer: value(row, "MANUFACTURER", "manufacturer", "Manufacturer") || "Not specified",
    model: value(row, "MODEL", "model", "Model No.") || "Not specified",
    floor,
    room,
    installDate,
    replacementDate: date(value(row, "ENDOFUSEFULLIFE"), addDays(installDate, lifeMonths * 30)),
    warrantyExpiry: date(value(row, "warrantyExpiry", "Warranty Expiry Date"), addYears(new Date(), 1)),
    contractRef: value(row, "contractRef", "Vendors") || "Not assigned",
    documentationUrl,
    purchaseCost: cost,
    salvageValue: number(value(row, "salvageValue", "Salvage Value"), Math.round(cost * 0.1)),
    depreciationRate: number(row.depreciationRate, 10),
    conditionScore: number(row.conditionScore, 85),
    qrCode: value(row, "qrCode", "QR Code") || `CAFM-ASSET:${tag}`,
  };
  const asset = await prisma.asset.upsert({
    where: { tag },
    update: assetData,
    create: {
      tag,
      ...assetData,
      siteId: site.id,
      buildingId: site.buildings[0]?.id,
    },
  });

  await prisma.assetHistory.create({
    data: {
      assetId: asset.id,
      eventType: "BULK_IMPORT",
      title: "Asset bulk imported",
      details: `Imported or updated from CSV: ${tag}`,
      actor: "Admin",
    },
  });
}

async function importInventory(row: Row) {
  await prisma.inventoryItem.upsert({
    where: { sku: required(row, "sku") },
    update: {
      name: required(row, "name"),
      category: row.category || "General",
      unit: row.unit || "pcs",
      onHand: integer(row.onHand, 0),
      reorderPoint: integer(row.reorderPoint, 0),
      unitCost: number(row.unitCost, 0),
      vendor: row.vendor || "Not assigned",
      location: row.location || "Central Store",
    },
    create: {
      sku: required(row, "sku"),
      name: required(row, "name"),
      category: row.category || "General",
      unit: row.unit || "pcs",
      onHand: integer(row.onHand, 0),
      reorderPoint: integer(row.reorderPoint, 0),
      unitCost: number(row.unitCost, 0),
      vendor: row.vendor || "Not assigned",
      location: row.location || "Central Store",
    },
  });
}

async function importRequest(row: Row) {
  const count = await prisma.serviceRequest.count();
  const slaHours = integer(row.slaHours, priority(row.priority) === "CRITICAL" ? 4 : 24);
  await prisma.serviceRequest.create({
    data: {
      ticketNo: row.ticketNo || `SR-${String(count + 24001).padStart(5, "0")}`,
      title: required(row, "title"),
      category: row.category || "General",
      departmentCode: row.departmentCode || "",
      serviceCode: row.serviceCode || "",
      assignedTeamCode: row.assignedTeamCode || "",
      requester: row.requester || "Bulk Upload",
      channel: row.channel || "Bulk Upload",
      priority: priority(row.priority),
      status: workStatus(row.status, "NEW"),
      location: row.location || "Unassigned",
      attachmentUrls: row.attachmentUrls || "",
      rejectionReason: row.rejectionReason || "",
      slaHours,
      dueAt: addHours(new Date(), slaHours),
      description: row.description || row.title || "Bulk uploaded request",
    },
  });
}

async function importWorkOrder(row: Row) {
  const count = await prisma.workOrder.count();
  const asset = row.assetTag ? await prisma.asset.findUnique({ where: { tag: row.assetTag } }) : null;
  await prisma.workOrder.create({
    data: {
      woNo: row.woNo || `WO-${String(count + 81001).padStart(5, "0")}`,
      title: required(row, "title"),
      type: row.type || "Corrective",
      assetType: row.assetType || asset?.assetGroup || asset?.category || "",
      departmentCode: row.departmentCode || "",
      serviceCode: row.serviceCode || "",
      assignedTeamCode: row.assignedTeamCode || "",
      jobPlanCode: row.jobPlanCode || "",
      priority: priority(row.priority),
      status: workStatus(row.status, "ASSIGNED"),
      assetId: asset?.id,
      plannedStart: new Date(),
      dueAt: addHours(new Date(), integer(row.dueHours, 24)),
      estimatedHours: number(row.estimatedHours, 2),
      cost: number(row.cost, 0),
      jobPlan: row.jobPlan || "Review, execute, document and close.",
      safetyNotes: row.safetyNotes || "Verify PPE and permits before work starts.",
      workNotes: row.workNotes || "",
      materialRequest: row.materialRequest || "",
      photoUrls: row.photoUrls || "",
      assetsUsed: row.assetsUsed || "",
      inventoryUsed: row.inventoryUsed || "",
      supervisorDecision: row.supervisorDecision || "",
    },
  });
}

async function importTeam(row: Row) {
  await prisma.team.upsert({
    where: { code: row.departmentCode || required(row, "code") },
    update: teamPayload(row),
    create: { code: row.departmentCode || required(row, "code"), ...teamPayload(row) },
  });
}

async function importDepartment(row: Row) {
  await prisma.department.upsert({
    where: { code: required(row, "code") },
    update: {
      name: required(row, "name"),
      siteLocation: row.siteLocation || "Unassigned",
      description: row.description || "",
    },
    create: {
      code: required(row, "code"),
      name: required(row, "name"),
      siteLocation: row.siteLocation || "Unassigned",
      description: row.description || "",
    },
  });
}

async function importEmployee(row: Row) {
  await prisma.employee.upsert({
    where: { companyId: required(row, "companyId") },
    update: employeePayload(row),
    create: { companyId: required(row, "companyId"), ...employeePayload(row) },
  });
}

async function importService(row: Row) {
  const team = row.teamCode ? await prisma.team.findUnique({ where: { code: row.teamCode } }) : null;
  await prisma.serviceCatalog.upsert({
    where: { code: row.departmentCode || required(row, "code") },
    update: servicePayload(row, team?.id),
    create: { code: row.departmentCode || required(row, "code"), ...servicePayload(row, team?.id) },
  });
}

async function importCategory(row: Row) {
  await prisma.assetCategory.upsert({
    where: { code: required(row, "code") },
    update: categoryPayload(row),
    create: { code: required(row, "code"), ...categoryPayload(row) },
  });
}

async function importInspection(row: Row) {
  const count = await prisma.inspection.count();
  await prisma.inspection.create({
    data: {
      code: row.code || `INS-${String(count + 1001).padStart(5, "0")}`,
      title: required(row, "title"),
      area: row.area || "General",
      inspector: row.inspector || "Bulk Upload",
      risk: risk(row.risk),
      score: integer(row.score, 85),
      status: workStatus(row.status, "NEW"),
      dueAt: date(row.dueAt, addDays(new Date(), 7)),
      findings: row.findings || "No findings recorded.",
    },
  });
}

async function importLocation(row: Row) {
  const code = required(row, "code", "Location");
  await prisma.location.upsert({
    where: { code },
    update: locationPayload(row),
    create: { code, ...locationPayload(row) },
  });
}

async function importJobPlan(row: Row) {
  await prisma.jobPlan.upsert({
    where: { code: required(row, "code") },
    update: jobPlanPayload(row),
    create: { code: required(row, "code"), ...jobPlanPayload(row) },
  });
}

function teamPayload(row: Row) {
  return {
    name: required(row, "name"),
    type: row.service || row.type || "Service Team",
    supervisor: row.companyIdNumber || row.supervisor || "Unassigned",
    phone: row.phone || "",
    email: row.email || "",
    shift: row.shift || "General",
    coverage: row.service || row.coverage || "Site-wide",
  };
}

function servicePayload(row: Row, teamId?: string) {
  return {
    name: row.departmentName || required(row, "name"),
    category: row.departmentName || row.category || "General",
    type: row.type || "Department Service",
    priority: priority(row.priority),
    slaHours: integer(row.slaHours, 24),
    teamId,
    description: row.description || `Department ${row.departmentCode || row.code || ""}`,
  };
}

function categoryPayload(row: Row) {
  return {
    name: required(row, "name"),
    type: row.type || "Asset",
    defaultLifeYrs: integer(row.defaultLifeYrs, 10),
    statutory: ["true", "yes", "1"].includes(String(row.statutory || "").toLowerCase()),
    description: row.description || "",
  };
}

function employeePayload(row: Row) {
  return {
    name: required(row, "name"),
    email: required(row, "email"),
    nationalityType: row.nationalityType || "Unspecified",
    departmentCode: row.departmentCode || "UNASSIGNED",
    siteLocation: row.siteLocation || "Unassigned",
  };
}

function locationPayload(row: Row) {
  const parentLocation = value(row, "parentLocation", "Parent Location", "ParentLocation", "zone");
  const locationClass = value(row, "locationClass", "Class", "class", "type") || "Facility Location";
  const outOfService = yesNo(value(row, "outOfService", "Out of Service"), false);
  return {
    site: value(row, "site", "Site") || "Fadhili Bachelor Camp",
    zone: parentLocation,
    building: row.building || row.BLDG || "Unassigned",
    floor: row.floor || row.FLOOR || "Unassigned",
    room: row.room || row.ROOM || "Unassigned",
    type: locationClass,
    parentLocation,
    locationClass,
    outOfService,
    residential: yesNo(value(row, "residential", "Residential"), false),
    active: !outOfService,
    description: value(row, "description", "Description") || "",
  };
}

function jobPlanPayload(row: Row) {
  return {
    name: required(row, "name"),
    assetType: required(row, "assetType"),
    departmentCode: row.departmentCode || "",
    serviceCode: row.serviceCode || "",
    estimatedHours: number(row.estimatedHours, 2),
    priority: priority(row.priority),
    steps: row.steps || row.jobPlan || "Inspect, execute, test and close.",
    safetyNotes: row.safetyNotes || "",
  };
}

function required(row: Row, ...keys: string[]) {
  const found = value(row, ...keys);
  if (!found) throw new Error(`${keys[0]} is required`);
  return found;
}

function value(row: Row, ...keys: string[]) {
  for (const key of keys) {
    const found = row[key];
    if (found !== undefined && found !== null && String(found).trim() !== "") return String(found).trim();
  }
  return "";
}

function number(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value: string | undefined, fallback: number) {
  return Math.round(number(value, fallback));
}

function yesNo(value: string | undefined, fallback: boolean) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["yes", "true", "1", "y"].includes(normalized)) return true;
  if (["no", "false", "0", "n"].includes(normalized)) return false;
  return fallback;
}

function date(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function priority(value: string | undefined) {
  const normalized = String(value || "MEDIUM").toUpperCase();
  return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(normalized) ? normalized as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" : "MEDIUM";
}

function assetStatus(value: string | undefined) {
  const normalized = String(value || "ACTIVE").toUpperCase();
  return ["ACTIVE", "STANDBY", "DOWN", "RETIRED"].includes(normalized) ? normalized as "ACTIVE" | "STANDBY" | "DOWN" | "RETIRED" : "ACTIVE";
}

function assetStatusFromImport(value: string | undefined) {
  const normalized = String(value || "INSTALLED").toUpperCase();
  if (["INSTALLED", "OPERATING", "ONLINE"].includes(normalized)) return "ACTIVE";
  if (["OUT OF SERVICE", "OUTOFSERVICE", "INACTIVE"].includes(normalized)) return "RETIRED";
  return assetStatus(normalized);
}

function workStatus(value: string | undefined, fallback: "NEW" | "ASSIGNED") {
  const normalized = String(value || fallback).toUpperCase();
  return ["NEW", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "PENDING_SUPERVISOR_REVIEW", "REOPENED", "CLOSED"].includes(normalized)
    ? normalized as "NEW" | "TRIAGED" | "ASSIGNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "PENDING_SUPERVISOR_REVIEW" | "REOPENED" | "CLOSED"
    : fallback;
}

function risk(value: string | undefined) {
  const normalized = String(value || "MODERATE").toUpperCase();
  return ["LOW", "MODERATE", "HIGH", "EXTREME"].includes(normalized) ? normalized as "LOW" | "MODERATE" | "HIGH" | "EXTREME" : "MODERATE";
}
