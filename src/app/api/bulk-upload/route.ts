import { NextResponse } from "next/server";
import { addDays, addHours, addYears } from "date-fns";
import { apiError } from "@/lib/api-response";
import { csvResponse, parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

type Row = Record<string, string>;

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(csvResponse(created, failed), { status: failed.length ? 207 : 201 });
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
  if (module === "categories") return importCategory(row);
  if (module === "inspections") return importInspection(row);
  throw new Error(`Unsupported module: ${module}`);
}

async function firstSite() {
  const site = await prisma.site.findFirst({ include: { buildings: { take: 1 } } });
  if (!site) throw new Error("No site found. Seed or create a site first.");
  return site;
}

async function importAsset(row: Row) {
  const site = await firstSite();
  const tag = required(row, "tag");
  const cost = number(row.purchaseCost, 0);
  const asset = await prisma.asset.upsert({
    where: { tag },
    update: {
      name: required(row, "name"),
      category: required(row, "category"),
      system: row.system || row.category || "General",
      criticality: priority(row.criticality),
      status: assetStatus(row.status),
      serialNumber: row.serialNumber || `${tag}-SN`,
      manufacturer: row.manufacturer || "Not specified",
      model: row.model || "Not specified",
      floor: row.floor || "Unassigned",
      room: row.room || "Unassigned",
      warrantyExpiry: date(row.warrantyExpiry, addYears(new Date(), 1)),
      contractRef: row.contractRef || "Not assigned",
      documentationUrl: row.documentationUrl || null,
      purchaseCost: cost,
      salvageValue: number(row.salvageValue, Math.round(cost * 0.1)),
      depreciationRate: number(row.depreciationRate, 10),
      conditionScore: number(row.conditionScore, 85),
      qrCode: `CAFM-ASSET:${tag}`,
    },
    create: {
      tag,
      name: required(row, "name"),
      category: required(row, "category"),
      system: row.system || row.category || "General",
      criticality: priority(row.criticality),
      status: assetStatus(row.status),
      serialNumber: row.serialNumber || `${tag}-SN`,
      manufacturer: row.manufacturer || "Not specified",
      model: row.model || "Not specified",
      installDate: date(row.installDate, new Date()),
      replacementDate: date(row.replacementDate, addYears(new Date(), 8)),
      warrantyExpiry: date(row.warrantyExpiry, addYears(new Date(), 1)),
      contractRef: row.contractRef || "Not assigned",
      documentationUrl: row.documentationUrl || null,
      purchaseCost: cost,
      salvageValue: number(row.salvageValue, Math.round(cost * 0.1)),
      depreciationRate: number(row.depreciationRate, 10),
      conditionScore: number(row.conditionScore, 85),
      floor: row.floor || "Unassigned",
      room: row.room || "Unassigned",
      qrCode: `CAFM-ASSET:${tag}`,
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
      requester: row.requester || "Bulk Upload",
      channel: row.channel || "Bulk Upload",
      priority: priority(row.priority),
      status: workStatus(row.status, "NEW"),
      location: row.location || "Unassigned",
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
      priority: priority(row.priority),
      status: workStatus(row.status, "ASSIGNED"),
      assetId: asset?.id,
      plannedStart: new Date(),
      dueAt: addHours(new Date(), integer(row.dueHours, 24)),
      estimatedHours: number(row.estimatedHours, 2),
      cost: number(row.cost, 0),
      jobPlan: row.jobPlan || "Review, execute, document and close.",
      safetyNotes: row.safetyNotes || "Verify PPE and permits before work starts.",
    },
  });
}

async function importTeam(row: Row) {
  await prisma.team.upsert({
    where: { code: required(row, "code") },
    update: teamPayload(row),
    create: { code: required(row, "code"), ...teamPayload(row) },
  });
}

async function importService(row: Row) {
  const team = row.teamCode ? await prisma.team.findUnique({ where: { code: row.teamCode } }) : null;
  await prisma.serviceCatalog.upsert({
    where: { code: required(row, "code") },
    update: servicePayload(row, team?.id),
    create: { code: required(row, "code"), ...servicePayload(row, team?.id) },
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

function teamPayload(row: Row) {
  return {
    name: required(row, "name"),
    type: row.type || "Service Team",
    supervisor: row.supervisor || "Unassigned",
    phone: row.phone || "",
    email: row.email || "",
    shift: row.shift || "General",
    coverage: row.coverage || "Site-wide",
  };
}

function servicePayload(row: Row, teamId?: string) {
  return {
    name: required(row, "name"),
    category: row.category || "General",
    type: row.type || "Service",
    priority: priority(row.priority),
    slaHours: integer(row.slaHours, 24),
    teamId,
    description: row.description || "",
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

function required(row: Row, key: string) {
  if (!row[key]) throw new Error(`${key} is required`);
  return row[key];
}

function number(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value: string | undefined, fallback: number) {
  return Math.round(number(value, fallback));
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

function workStatus(value: string | undefined, fallback: "NEW" | "ASSIGNED") {
  const normalized = String(value || fallback).toUpperCase();
  return ["NEW", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CLOSED"].includes(normalized)
    ? normalized as "NEW" | "TRIAGED" | "ASSIGNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CLOSED"
    : fallback;
}

function risk(value: string | undefined) {
  const normalized = String(value || "MODERATE").toUpperCase();
  return ["LOW", "MODERATE", "HIGH", "EXTREME"].includes(normalized) ? normalized as "LOW" | "MODERATE" | "HIGH" | "EXTREME" : "MODERATE";
}
