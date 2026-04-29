import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  tag: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  system: z.string().optional(),
  criticality: z.string().optional(),
  status: z.string().optional(),
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const current = await prisma.asset.findUnique({ where: { id } });
    if (!current) throw new Error("Asset not found");
    const tag = input.tag || current.tag;
    const name = input.name || current.name;
    const category = input.category || current.category;
    const criticality = input.criticality && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(input.criticality) ? input.criticality as any : current.criticality;
    const status = input.status && ["ACTIVE", "STANDBY", "DOWN", "RETIRED"].includes(input.status) ? input.status as any : current.status;
    const updated = await prisma.asset.update({
      where: { id },
      data: {
        tag,
        name,
        category,
        system: input.system || current.system,
        criticality,
        status,
        serialNumber: input.serialNumber || null,
        siteCode: input.siteCode || null,
        zone: input.zone || null,
        buildingCode: input.buildingCode || null,
        assetGroup: input.assetGroup || category,
        assetDescription: input.assetDescription || name,
        additionalDescription: input.additionalDescription || null,
        parentAsset: input.parentAsset || null,
        departmentCode: input.departmentCode || null,
        assignedTeamCode: input.assignedTeamCode || null,
        assignedSupervisorEmail: input.assignedSupervisorEmail || null,
        remarks: input.remarks || null,
        manufacturer: input.manufacturer || "Not specified",
        model: input.model || "Not specified",
        installDate: input.installDate ? new Date(input.installDate) : current.installDate,
        replacementDate: input.replacementDate ? new Date(input.replacementDate) : current.replacementDate,
        floor: input.floor || null,
        room: input.room || null,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
        contractRef: input.contractRef || null,
        documentationUrl: input.documentationUrl || null,
        purchaseCost: input.purchaseCost ?? current.purchaseCost,
        salvageValue: input.salvageValue ?? current.salvageValue,
        depreciationRate: input.depreciationRate ?? current.depreciationRate,
        conditionScore: input.conditionScore ?? current.conditionScore,
        qrCode: input.qrCode || `CAFM-ASSET:${tag}`,
      },
    });

    await prisma.assetHistory.create({
      data: {
        assetId: updated.id,
        eventType: "ASSET_UPDATE",
        title: "Asset master updated",
        details: `Updated asset ${updated.tag}. Status: ${updated.status}. Team: ${updated.assignedTeamCode || "Unassigned"}.`,
        actor: "Admin",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Unable to update asset");
  }
}
