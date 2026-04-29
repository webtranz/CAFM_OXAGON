import { NextResponse } from "next/server";
import { addYears } from "date-fns";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  tag: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  system: z.string().optional(),
  criticality: z.string().optional(),
  serialNumber: z.string().optional(),
  siteCode: z.string().optional(),
  zone: z.string().optional(),
  buildingCode: z.string().optional(),
  assetGroup: z.string().optional(),
  assetDescription: z.string().optional(),
  additionalDescription: z.string().optional(),
  parentAsset: z.string().optional(),
  departmentCode: z.string().optional(),
  assignedTeamCode: z.string().optional(),
  assignedSupervisorEmail: z.string().optional(),
  remarks: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  installDate: z.string().optional(),
  replacementDate: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  qrCode: z.string().optional(),
  contractRef: z.string().optional(),
  documentationUrl: z.string().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  salvageValue: z.coerce.number().min(0).optional(),
  depreciationRate: z.coerce.number().min(0).max(100).optional(),
  conditionScore: z.coerce.number().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const count = await prisma.asset.count();
    const tag = input.tag || `AST-${String(count + 1).padStart(5, "0")}`;
    const name = input.name || input.assetDescription || `Asset ${count + 1}`;
    const category = input.category || input.assetGroup || "General";
    const criticality = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(input.criticality || "") ? input.criticality as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" : "MEDIUM";
    const site = await prisma.site.findFirst({ include: { buildings: { take: 1 } } });

    if (!site) {
      return apiError(new Error("Create or seed a site before adding assets."), "No site available", 400);
    }

    const created = await prisma.asset.create({
      data: {
        tag,
        name,
        category,
        system: input.system || "General",
        criticality,
        serialNumber: input.serialNumber || `${tag}-SN`,
        siteCode: input.siteCode || null,
        zone: input.zone || null,
        buildingCode: input.buildingCode || null,
        assetGroup: input.assetGroup || category,
        assetDescription: input.assetDescription || name,
        additionalDescription: input.additionalDescription || null,
        parentAsset: input.parentAsset || "TOP LEVEL",
        departmentCode: input.departmentCode || null,
        assignedTeamCode: input.assignedTeamCode || null,
        assignedSupervisorEmail: input.assignedSupervisorEmail || null,
        remarks: input.remarks || null,
        manufacturer: input.manufacturer || "Not specified",
        model: input.model || "Not specified",
        installDate: input.installDate ? new Date(input.installDate) : new Date(),
        replacementDate: input.replacementDate ? new Date(input.replacementDate) : addYears(new Date(), 8),
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : addYears(new Date(), 1),
        contractRef: input.contractRef || "Not assigned",
        documentationUrl: input.documentationUrl || null,
        purchaseCost: input.purchaseCost ?? 0,
        salvageValue: input.salvageValue ?? 0,
        depreciationRate: input.depreciationRate ?? 10,
        conditionScore: input.conditionScore ?? 85,
        floor: input.floor || "Unassigned",
        room: input.room || "Unassigned",
        qrCode: input.qrCode || `CAFM-ASSET:${tag}`,
        siteId: site.id,
        buildingId: site.buildings[0]?.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create asset");
  }
}
