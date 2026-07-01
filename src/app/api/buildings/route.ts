import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { paginationMeta, readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  siteId: z.string().optional(),
  site: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  floors: z.coerce.number().int().min(0).optional(),
  areaSqm: z.coerce.number().int().min(0).optional(),
});

async function resolveSite(input: z.infer<typeof schema>) {
  if (input.siteId) {
    const site = await prisma.site.findUnique({ where: { id: input.siteId } });
    if (site) return site;
  }
  const name = input.site || "Fadhili Bachelor Camp";
  const city = input.city || "Fadhili";
  const country = input.country || "Saudi Arabia";
  return prisma.site.upsert({
    where: { name_city_country: { name, city, country } },
    update: {},
    create: { name, city, country, type: "Facility", areaSqm: 0 },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() || "";
  const locationScope = url.searchParams.get("locationScope")?.trim() || "";
  const pagination = readPagination(url);
  const andFilters: any[] = [];
  if (query) {
    andFilters.push({
      OR: [
        { code: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { site: { name: { contains: query, mode: "insensitive" } } },
        { site: { city: { contains: query, mode: "insensitive" } } },
        { site: { country: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  if (locationScope && locationScope !== "All") {
    const housingFilter = {
      OR: [
        { code: { contains: "W-A", mode: "insensitive" } },
        { code: { contains: "W-B", mode: "insensitive" } },
        { code: { contains: "E-A", mode: "insensitive" } },
        { code: { contains: "E-B", mode: "insensitive" } },
        { name: { contains: "housing", mode: "insensitive" } },
        { name: { contains: "accommodation", mode: "insensitive" } },
        { name: { contains: "accomodation", mode: "insensitive" } },
        { name: { contains: "bedroom", mode: "insensitive" } },
      ],
    };
    const nonHousingFilter = {
      OR: [
        { code: { contains: "CB-", mode: "insensitive" } },
        { name: { contains: "non housing", mode: "insensitive" } },
        { name: { contains: "catering", mode: "insensitive" } },
        { name: { contains: "landscaping", mode: "insensitive" } },
        { name: { contains: "recreation", mode: "insensitive" } },
        { name: { contains: "gym", mode: "insensitive" } },
        { NOT: housingFilter },
      ],
    };
    andFilters.push(locationScope.toLowerCase().includes("non") ? nonHousingFilter : housingFilter);
  }
  const where = andFilters.length ? { AND: andFilters } : {};
  const [total, buildings] = await Promise.all([
    prisma.building.count({ where }),
    prisma.building.findMany({
      where,
      include: { site: true },
      orderBy: { code: "asc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
  return NextResponse.json({ buildings, total, ...paginationMeta(total, pagination) });
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("assets.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const site = await resolveSite(input);
    const count = await prisma.building.count();
    const code = input.code || `BLD-${String(count + 1).padStart(3, "0")}`;
    const name = input.name || code;
    const building = await prisma.building.upsert({
      where: { code },
      update: { name, siteId: site.id, floors: input.floors ?? 1, areaSqm: input.areaSqm ?? 0 },
      create: { code, name, siteId: site.id, floors: input.floors ?? 1, areaSqm: input.areaSqm ?? 0 },
    });
    await auditAction({ user, action: "BUILDING_SAVE", entity: "building", entityId: building.id, details: { input, savedRecord: building } });
    return NextResponse.json(building, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save building");
  }
}
