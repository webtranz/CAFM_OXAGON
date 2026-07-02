import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { buildLocationHierarchy, hierarchyFromLocation, uniqueSorted } from "@/lib/location-hierarchy";
import { paginationMeta, readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

function clean(value: string | null) {
  return String(value ?? "").trim();
}

function contains(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

function hierarchyWhere(url: URL) {
  const site = clean(url.searchParams.get("site"));
  const sp = clean(url.searchParams.get("sp"));
  const region = clean(url.searchParams.get("region"));
  const block = clean(url.searchParams.get("block"));
  const building = clean(url.searchParams.get("building"));
  const floor = clean(url.searchParams.get("floor"));
  const room = clean(url.searchParams.get("room"));
  const query = clean(url.searchParams.get("query"));
  const where: any = {
    active: true,
    outOfService: false,
    ...(site ? { site } : {}),
    ...(sp ? { sp } : {}),
    ...(region ? { OR: [{ region }, { zone: region }] } : {}),
    ...(block ? { block } : {}),
    ...(building ? { building } : {}),
    ...(floor ? { floor } : {}),
    ...(room ? { OR: [{ room }, { code: room }] } : {}),
  };

  if (query) {
    const search = [
      { code: contains(query) },
      { combinedLocationCode: contains(query) },
      { fullLocationPath: contains(query) },
      { description: contains(query) },
      { site: contains(query) },
      { sp: contains(query) },
      { region: contains(query) },
      { zone: contains(query) },
      { block: contains(query) },
      { building: contains(query) },
      { floor: contains(query) },
      { room: contains(query) },
    ];
    where.AND = [...(where.AND ?? []), { OR: search }];
  }
  return where;
}

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const url = new URL(request.url);
  const pagination = readPagination(url);
  const where = hierarchyWhere(url);

  const [allLocations, total, locations] = await Promise.all([
    prisma.location.findMany({
      where,
      select: {
        id: true,
        code: true,
        site: true,
        sp: true,
        region: true,
        zone: true,
        block: true,
        building: true,
        floor: true,
        room: true,
        description: true,
        combinedLocationCode: true,
        fullLocationPath: true,
        residential: true,
        locationClass: true,
      },
      orderBy: [{ site: "asc" }, { sp: "asc" }, { building: "asc" }, { floor: "asc" }, { room: "asc" }],
      take: 20000,
    }),
    prisma.location.count({ where }),
    prisma.location.findMany({
      where,
      select: {
        id: true,
        code: true,
        site: true,
        sp: true,
        region: true,
        zone: true,
        block: true,
        building: true,
        floor: true,
        room: true,
        description: true,
        combinedLocationCode: true,
        fullLocationPath: true,
        residential: true,
        locationClass: true,
      },
      orderBy: [{ site: "asc" }, { sp: "asc" }, { building: "asc" }, { floor: "asc" }, { room: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  const locationCodes = locations.map((location) => location.code);
  const assets = url.searchParams.get("includeAssets") === "1" || clean(url.searchParams.get("room"));
  const linkedAssets = assets
    ? await prisma.asset.findMany({
        where: {
          OR: [
            { locationCode: { in: locationCodes } },
            { room: { in: locationCodes } },
            ...(clean(url.searchParams.get("building")) ? [{ buildingCode: clean(url.searchParams.get("building")) }] : []),
          ],
        },
        select: {
          id: true,
          tag: true,
          name: true,
          assetDescription: true,
          category: true,
          assetGroup: true,
          status: true,
          assetStatusText: true,
          locationCode: true,
          combinedLocationCode: true,
          fullLocationPath: true,
          workOrders: { select: { woNo: true, status: true, title: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5 },
          history: { select: { eventType: true, title: true, details: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { tag: "asc" },
        take: 5000,
      })
    : [];

  const normalizedLocations = locations.map((location) => {
    const hierarchy = hierarchyFromLocation(location);
    return {
      ...location,
      region: location.region || location.zone,
      combinedLocationCode: location.combinedLocationCode || hierarchy.combinedLocationCode,
      fullLocationPath: location.fullLocationPath || hierarchy.fullLocationPath,
    };
  });

  return NextResponse.json({
    hierarchy: "Site > SP > Region > Block > Building > Floor > Room > Asset",
    options: {
      sites: uniqueSorted(allLocations.map((location) => location.site)),
      sps: uniqueSorted(allLocations.map((location) => location.sp)),
      regions: uniqueSorted(allLocations.map((location) => location.region || location.zone)),
      blocks: uniqueSorted(allLocations.map((location) => location.block)),
      buildings: uniqueSorted(allLocations.map((location) => location.building)),
      floors: uniqueSorted(allLocations.map((location) => location.floor)),
      rooms: uniqueSorted(allLocations.map((location) => location.room || location.code)),
    },
    selected: buildLocationHierarchy({
      site: url.searchParams.get("site"),
      sp: url.searchParams.get("sp"),
      region: url.searchParams.get("region"),
      block: url.searchParams.get("block"),
      building: url.searchParams.get("building"),
      floor: url.searchParams.get("floor"),
      room: url.searchParams.get("room"),
      asset: url.searchParams.get("asset"),
    }),
    locations: normalizedLocations,
    assets: linkedAssets,
    total,
    ...paginationMeta(total, pagination),
  });
}
