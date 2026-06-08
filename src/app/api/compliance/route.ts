import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireAdmin, requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  certificateNo: z.string().optional(),
  title: z.string().optional(),
  authority: z.string().optional(),
  category: z.string().optional(),
  assetTag: z.string().optional(),
  location: z.string().optional(),
  owner: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.string().optional(),
  risk: z.string().optional(),
  renewalLeadDays: z.coerce.number().int().min(0).optional(),
  evidenceUrl: z.string().optional(),
  notes: z.string().optional(),
});

const risks = ["LOW", "MODERATE", "HIGH", "EXTREME"];

function parseDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function DELETE(request: Request) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("Compliance certificate id is required");
    const current = await prisma.complianceCertificate.findUnique({ where: { id } });
    if (!current) throw new Error("Compliance certificate not found");
    await prisma.complianceCertificate.delete({ where: { id } });
    await auditAction({ user, action: "COMPLIANCE_CERTIFICATE_DELETE", entity: "compliance_certificate", entityId: id, details: { deletedRecord: current } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete compliance certificate");
  }
}

export async function GET() {
  const { error } = await requirePermission("compliance.view");
  if (error) return error;
  return NextResponse.json(await prisma.complianceCertificate.findMany({ orderBy: [{ expiryDate: "asc" }, { certificateNo: "asc" }] }));
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("compliance.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.complianceCertificate.count();
    const certificateNo = input.certificateNo || `CERT-${String(count + 1).padStart(5, "0")}`;
    const expiryDate = parseDate(input.expiryDate, addDays(new Date(), 365));
    const status = input.status || (expiryDate.getTime() < Date.now() ? "EXPIRED" : "ACTIVE");
    const created = await prisma.complianceCertificate.upsert({
      where: { certificateNo },
      update: {
        title: input.title || "Compliance Certificate",
        authority: input.authority || "Authority",
        category: input.category || "General",
        assetTag: input.assetTag || null,
        location: input.location || "General",
        owner: input.owner || "Compliance Owner",
        issueDate: parseDate(input.issueDate, new Date()),
        expiryDate,
        status,
        risk: risks.includes(input.risk || "") ? input.risk as any : "LOW",
        renewalLeadDays: input.renewalLeadDays ?? 30,
        evidenceUrl: input.evidenceUrl || "",
        notes: input.notes || "No notes recorded.",
      },
      create: {
        certificateNo,
        title: input.title || "Compliance Certificate",
        authority: input.authority || "Authority",
        category: input.category || "General",
        assetTag: input.assetTag || null,
        location: input.location || "General",
        owner: input.owner || "Compliance Owner",
        issueDate: parseDate(input.issueDate, new Date()),
        expiryDate,
        status,
        risk: risks.includes(input.risk || "") ? input.risk as any : "LOW",
        renewalLeadDays: input.renewalLeadDays ?? 30,
        evidenceUrl: input.evidenceUrl || "",
        notes: input.notes || "No notes recorded.",
      },
    });
    await auditAction({ user, action: "COMPLIANCE_CERTIFICATE_SAVE", entity: "compliance_certificate", entityId: created.id, details: { input, savedRecord: created } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save compliance certificate");
  }
}
