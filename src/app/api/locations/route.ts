import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { buildLocationHierarchy } from "@/lib/location-hierarchy";
import { paginationMeta, readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const boolInput = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "true", "1", "y"].includes(normalized)) return true;
    if (["no", "false", "0", "n", ""].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const schema = z.object({
  code: z.string().optional(),
  location: z.string().optional(),
  site: z.string().optional(),
  sp: z.string().optional(),
  region: z.string().optional(),
  zone: z.string().optional(),
  block: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  type: z.string().optional(),
  parentLocation: z.string().optional(),
  locationClass: z.string().optional(),
  class: z.string().optional(),
  outOfService: boolInput.optional(),
  residential: boolInput.optional(),
  description: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requirePermission("requests.manage");
  if (error) return error;
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() || "";
  const parentLocation = url.searchParams.get("parentLocation")?.trim() || "";
  const locationClass = url.searchParams.get("locationClass")?.trim() || "";
  const residential = url.searchParams.get("residential")?.trim() || "";
  const locationScope = url.searchParams.get("locationScope")?.trim() || "";
  const pagination = readPagination(url);
  const where: any = {
    ...(parentLocation ? { parentLocation } : {}),
    ...(locationClass ? { locationClass } : {}),
    ...(residential === "YES" ? { residential: true } : {}),
    ...(residential === "NO" ? { residential: false } : {}),
  };
  if (query) {
    where.OR = [
      { code: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { parentLocation: { contains: query, mode: "insensitive" } },
      { locationClass: { contains: query, mode: "insensitive" } },
      { type: { contains: query, mode: "insensitive" } },
      { site: { contains: query, mode: "insensitive" } },
      { zone: { contains: query, mode: "insensitive" } },
      { building: { contains: query, mode: "insensitive" } },
      { floor: { contains: query, mode: "insensitive" } },
      { room: { contains: query, mode: "insensitive" } },
    ];
  }
  if (locationScope) {
    const housingTerms = ["housing", "accommodation", "accomodation", "bedroom", "bed", "room"];
    const nonHousingTerms = ["non housing", "non-housing", "catering", "landscaping", "recreation", "gym", "kitchen", "dining", "laundry"];
    const housingFilter = {
      OR: [
        { residential: true },
        ...housingTerms.flatMap((term) => [
          { code: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { type: { contains: term, mode: "insensitive" } },
          { locationClass: { contains: term, mode: "insensitive" } },
          { building: { contains: term, mode: "insensitive" } },
          { room: { contains: term, mode: "insensitive" } },
        ]),
      ],
    };
    const nonHousingFilter = {
      OR: [
        ...nonHousingTerms.flatMap((term) => [
          { code: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { type: { contains: term, mode: "insensitive" } },
          { locationClass: { contains: term, mode: "insensitive" } },
          { building: { contains: term, mode: "insensitive" } },
        ]),
        { NOT: housingFilter },
      ],
    };
    const scopeFilter = locationScope.toLowerCase().includes("non") ? nonHousingFilter : housingFilter;
    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), scopeFilter];
  }
  const [total, locations] = await Promise.all([
    prisma.location.count({ where }),
    prisma.location.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: [{ code: "asc" }],
    }),
  ]);
  return NextResponse.json({ locations, total, ...paginationMeta(total, pagination) });
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("requests.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.location.count();
    const code = input.code || input.location || `LOC-${String(count + 1).padStart(4, "0")}`;
    const locationClass = input.locationClass || input.class || input.type || "Facility Location";
    const outOfService = input.outOfService ?? false;
    const hierarchy = buildLocationHierarchy({
      site: input.site || "Main Site",
      sp: input.sp,
      region: input.region || input.zone,
      block: input.block,
      building: input.building || "Building",
      floor: input.floor || "Floor",
      room: code,
    });
    const data = {
      code,
      site: input.site || "Main Site",
      sp: hierarchy.sp || "",
      region: hierarchy.region || "",
      zone: input.parentLocation || input.zone || "",
      block: hierarchy.block || "",
      building: input.building || "Building",
      floor: input.floor || "Floor",
      room: input.room || "Room",
      combinedLocationCode: hierarchy.combinedLocationCode,
      fullLocationPath: hierarchy.fullLocationPath,
      type: locationClass,
      parentLocation: input.parentLocation || input.zone || "",
      locationClass,
      outOfService,
      residential: input.residential ?? false,
      active: !outOfService,
      description: input.description || "",
    };
    const location = await prisma.location.upsert({
      where: { code },
      update: data,
      create: data,
    });
    await auditAction({ user, action: "LOCATION_SAVE", entity: "location", entityId: location.id, details: { input, savedRecord: location } });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save location");
  }
}
