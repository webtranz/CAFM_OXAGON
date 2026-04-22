import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ReportRow = Record<string, string | number | boolean | null>;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "assets";
  const format = url.searchParams.get("format") || "preview";
  const rows = await reportRows(type);

  if (format === "csv") {
    return file(csv(rows), "text/csv", `${type}.csv`);
  }
  if (format === "excel") {
    return file(excel(rows, type), "application/vnd.ms-excel", `${type}.xls`);
  }
  if (format === "pdf") {
    return file(pdf(rows, type), "application/pdf", `${type}.pdf`);
  }
  return NextResponse.json({ type, rows });
}

async function reportRows(type: string): Promise<ReportRow[]> {
  if (type === "work-orders") {
    const rows = await prisma.workOrder.findMany({ include: { asset: true, assignedTo: true }, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ woNo: row.woNo, title: row.title, type: row.type, priority: row.priority, status: row.status, asset: row.asset?.tag ?? "", assignedTo: row.assignedTo?.name ?? "", cost: Number(row.cost) }));
  }
  if (type === "requests") {
    const rows = await prisma.serviceRequest.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ ticketNo: row.ticketNo, title: row.title, category: row.category, requester: row.requester, priority: row.priority, status: row.status, location: row.location }));
  }
  if (type === "inventory") {
    const rows = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => ({ sku: row.sku, name: row.name, category: row.category, onHand: row.onHand, reorderPoint: row.reorderPoint, unitCost: Number(row.unitCost), vendor: row.vendor }));
  }
  if (type === "ppm") {
    const rows = await prisma.preventiveMaintenance.findMany({ orderBy: { nextDue: "asc" } });
    return rows.map((row) => ({ code: row.code, name: row.name, assetTag: row.assetTag, frequency: row.frequency, nextDue: row.nextDue.toISOString().slice(0, 10), active: row.active }));
  }
  const rows = await prisma.asset.findMany({ include: { building: true, site: true }, orderBy: { tag: "asc" } });
  return rows.map((row) => ({ tag: row.tag, name: row.name, category: row.category, system: row.system, status: row.status, building: row.building?.name ?? "", floor: row.floor ?? "", room: row.room ?? "", condition: row.conditionScore, cost: Number(row.purchaseCost) }));
}

function csv(rows: ReportRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => quote(row[header])).join(","))].join("\n");
}

function excel(rows: ReportRow[], title: string) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return `<html><body><h1>${title}</h1><table border="1"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
}

function pdf(rows: ReportRow[], title: string) {
  const lines = [`BrightWorks CAFM Report: ${title}`, `Generated: ${new Date().toISOString()}`, "", ...rows.slice(0, 35).map((row) => Object.values(row).join(" | "))];
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

function quote(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function file(body: string, contentType: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
