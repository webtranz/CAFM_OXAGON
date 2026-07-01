import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { paginationMeta, readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().optional(),
  floor: z.string().optional(),
  type: z.string().optional(),
  capacity: z.coerce.number().int().min(0).optional(),
  areaSqm: z.coerce.number().int().min(0).optional(),
  occupancy: z.coerce.number().int().min(0).optional(),
  buildingId: z.string().optional(),
  buildingCode: z.string().optional(),
  site: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

async function resolveBuilding(input: z.infer<typeof schema>) {
  if (input.buildingId) {
    const building = await prisma.building.findUnique({ where: { id: input.buildingId } });
    if (building) return building;
  }
  const code = input.buildingCode || "FBC";
  const existing = await prisma.building.findUnique({ where: { code } });
  if (existing) return existing;
  const siteName = input.site || "Fadhili Bachelor Camp";
  const city = input.city || "Fadhili";
  const country = input.country || "Saudi Arabia";
  const site = await prisma.site.upsert({
    where: { name_city_country: { name: siteName, city, country } },
    update: {},
    create: { name: siteName, city, country, type: "Facility", areaSqm: 0 },
  });
  return prisma.building.create({ data: { code, name: code, siteId: site.id, floors: 1, areaSqm: 0 } });
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
        { name: { contains: query, mode: "insensitive" } },
        { floor: { contains: query, mode: "insensitive" } },
        { type: { contains: query, mode: "insensitive" } },
        { building: { code: { contains: query, mode: "insensitive" } } },
        { building: { name: { contains: query, mode: "insensitive" } } },
        { building: { site: { name: { contains: query, mode: "insensitive" } } } },
        { building: { site: { city: { contains: query, mode: "insensitive" } } } },
      ],
    });
  }
  if (locationScope && locationScope !== "All") {
    const housingFilter = {
      OR: [
        { building: { code: { contains: "W-A", mode: "insensitive" } } },
        { building: { code: { contains: "W-B", mode: "insensitive" } } },
        { building: { code: { contains: "E-A", mode: "insensitive" } } },
        { building: { code: { contains: "E-B", mode: "insensitive" } } },
        { building: { name: { contains: "housing", mode: "insensitive" } } },
        { building: { name: { contains: "accommodation", mode: "insensitive" } } },
        { building: { name: { contains: "accomodation", mode: "insensitive" } } },
        { name: { contains: "bedroom", mode: "insensitive" } },
        { type: { contains: "bed", mode: "insensitive" } },
      ],
    };
    const nonHousingFilter = {
      OR: [
        { building: { code: { contains: "CB-", mode: "insensitive" } } },
        { type: { contains: "non housing", mode: "insensitive" } },
        { type: { contains: "catering", mode: "insensitive" } },
        { type: { contains: "landscaping", mode: "insensitive" } },
        { type: { contains: "recreation", mode: "insensitive" } },
        { type: { contains: "gym", mode: "insensitive" } },
        { NOT: housingFilter },
      ],
    };
    andFilters.push(locationScope.toLowerCase().includes("non") ? nonHousingFilter : housingFilter);
  }
  const where = andFilters.length ? { AND: andFilters } : {};
  const [total, spaces] = await Promise.all([
    prisma.space.count({ where }),
    prisma.space.findMany({
      where,
      include: { building: { include: { site: true } } },
      orderBy: [{ building: { code: "asc" } }, { floor: "asc" }, { name: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
  return NextResponse.json({ spaces, total, ...paginationMeta(total, pagination) });
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("assets.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const building = await resolveBuilding(input);
    const count = await prisma.space.count();
    const name = input.name || `Space ${String(count + 1).padStart(4, "0")}`;
    const floor = input.floor || "Ground";
    const type = input.type || "Space";
    const space = await prisma.space.upsert({
      where: { buildingId_floor_name: { buildingId: building.id, floor, name } },
      update: { type, capacity: input.capacity ?? 0, areaSqm: input.areaSqm ?? 0, occupancy: input.occupancy ?? 0 },
      create: { buildingId: building.id, name, floor, type, capacity: input.capacity ?? 0, areaSqm: input.areaSqm ?? 0, occupancy: input.occupancy ?? 0 },
    });
    await auditAction({ user, action: "SPACE_SAVE", entity: "space", entityId: space.id, details: { input, savedRecord: space } });
    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save space");
  }
}
