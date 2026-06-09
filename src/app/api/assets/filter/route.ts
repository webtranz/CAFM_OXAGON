import { NextResponse } from "next/server";
import { accessRole } from "@/lib/access-control";
import { requireUser } from "@/lib/api-auth";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;
  const url = new URL(request.url);
  const site = url.searchParams.get("site") || undefined;
  const building = url.searchParams.get("building") || undefined;
  const floor = url.searchParams.get("floor") || undefined;
  const room = url.searchParams.get("room") || undefined;
  const query = url.searchParams.get("query")?.trim() || "";
  const filterField = url.searchParams.get("filterField")?.trim() || "";
  const filterValue = url.searchParams.get("filterValue")?.trim() || "";
  const locationCode = url.searchParams.get("locationCode")?.trim() || "";
  const classValue = url.searchParams.get("class")?.trim() || "";
  const status = url.searchParams.get("status")?.trim() || "";
  const pageInput = Number(url.searchParams.get("page") || 1);
  const pageSizeInput = Number(url.searchParams.get("pageSize") || 100);
  const page = Number.isFinite(pageInput) ? Math.max(1, Math.floor(pageInput)) : 1;
  const pageSize = Number.isFinite(pageSizeInput) ? Math.min(200, Math.max(25, Math.floor(pageSizeInput))) : 100;
  const user = await getCurrentUser();
  const role = accessRole(user);
  const searchableFields = new Set([
    "tag",
    "name",
    "assetDescription",
    "assetStatusText",
    "eqType",
    "organization",
    "departmentCode",
    "departmentDesc",
    "classCode",
    "classDesc",
    "category",
    "categoryDesc",
    "serialNumber",
    "model",
    "manufacturer",
    "locationCode",
    "locationDesc",
    "primarySystem",
    "additionalNote",
  ]);
  const where: any = {
    ...(site ? { siteCode: site } : {}),
    ...(building ? { buildingCode: building } : {}),
    ...(floor ? { floor } : {}),
    ...(room ? { room } : {}),
    ...(locationCode ? { locationCode } : {}),
    ...(status ? { assetStatusText: status } : {}),
    ...(role === "supervisor" || role === "technician" ? { departmentCode: user?.department || "__none__" } : {}),
  };
  const andFilters: any[] = [];
  if (query) {
    andFilters.push({
      OR: [
        { tag: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { assetDescription: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        { assetGroup: { contains: query, mode: "insensitive" } },
        { classCode: { contains: query, mode: "insensitive" } },
        { locationCode: { contains: query, mode: "insensitive" } },
        { locationDesc: { contains: query, mode: "insensitive" } },
        { serialNumber: { contains: query, mode: "insensitive" } },
        { manufacturer: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (filterField && filterValue && searchableFields.has(filterField)) {
    andFilters.push({ [filterField]: { contains: filterValue, mode: "insensitive" } });
  }
  if (classValue) {
    andFilters.push({ OR: [{ classCode: classValue }, { category: classValue }, { assetGroup: classValue }] });
  }
  if (andFilters.length) where.AND = andFilters;
  const [total, assets] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ tag: "asc" }],
      include: {
        site: { select: { name: true } },
        building: { select: { name: true, code: true } },
        workOrders: { take: 8, orderBy: { updatedAt: "desc" }, select: { woNo: true, title: true, status: true, updatedAt: true, inventoryUsed: true, workNotes: true } },
        history: { take: 8, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);
  return NextResponse.json({ assets, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function HEAD() {
  return new Response(null, { status: 204 });
}
