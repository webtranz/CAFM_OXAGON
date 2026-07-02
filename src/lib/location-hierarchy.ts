import { prisma } from "@/lib/prisma";

export type LocationHierarchyInput = {
  site?: string | null;
  sp?: string | null;
  region?: string | null;
  block?: string | null;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  asset?: string | null;
};

export type LocationHierarchy = Required<LocationHierarchyInput> & {
  combinedLocationCode: string;
  fullLocationPath: string;
};

const EMPTY_HIERARCHY: Required<LocationHierarchyInput> = {
  site: "",
  sp: "",
  region: "",
  block: "",
  building: "",
  floor: "",
  room: "",
  asset: "",
};

function clean(value?: string | null) {
  return String(value ?? "").trim();
}

function codePart(value?: string | null) {
  return clean(value).replace(/\s+/g, "").toUpperCase();
}

function pathPart(label: string, value?: string | null) {
  const text = clean(value);
  return text ? `${label}: ${text}` : "";
}

export function inferHierarchyFromLocationCode(code?: string | null): Partial<LocationHierarchyInput> {
  const normalized = codePart(code);
  const parts = normalized.split("-").filter(Boolean);
  if (parts.length < 5) return {};

  const [site, region, building, floor, room, asset] = parts;
  return {
    site,
    region,
    block: building?.slice(0, 1) || "",
    building: region && building ? `${region}-${building}` : building,
    floor,
    room,
    asset,
  };
}

export function buildLocationHierarchy(input: LocationHierarchyInput): LocationHierarchy {
  const inferred = inferHierarchyFromLocationCode(input.room || input.asset);
  const hierarchy = {
    ...EMPTY_HIERARCHY,
    ...inferred,
    site: clean(input.site) || clean(inferred.site),
    sp: clean(input.sp),
    region: clean(input.region) || clean(inferred.region),
    block: clean(input.block) || clean(inferred.block),
    building: clean(input.building) || clean(inferred.building),
    floor: clean(input.floor) || clean(inferred.floor),
    room: clean(input.room) || clean(inferred.room),
    asset: clean(input.asset) || clean(inferred.asset),
  };
  const codeSegments = [
    hierarchy.site,
    hierarchy.sp,
    hierarchy.region,
    hierarchy.block,
    hierarchy.building,
    hierarchy.floor,
    hierarchy.room,
    hierarchy.asset,
  ].map(codePart).filter(Boolean);
  const pathSegments = [
    pathPart("Site", hierarchy.site),
    pathPart("SP", hierarchy.sp),
    pathPart("Region", hierarchy.region),
    pathPart("Block", hierarchy.block),
    pathPart("Building", hierarchy.building),
    pathPart("Floor", hierarchy.floor),
    pathPart("Room", hierarchy.room),
    pathPart("Asset", hierarchy.asset),
  ].filter(Boolean);

  return {
    ...hierarchy,
    combinedLocationCode: codeSegments.join("-"),
    fullLocationPath: pathSegments.join(" > "),
  };
}

export function hierarchyFromLocation(location: any, assetTag?: string | null): LocationHierarchy {
  return buildLocationHierarchy({
    site: location?.site,
    sp: location?.sp,
    region: location?.region || location?.zone,
    block: location?.block,
    building: location?.building,
    floor: location?.floor,
    room: location?.code || location?.room,
    asset: assetTag,
  });
}

export async function requireLocationByCode(code?: string | null) {
  const value = clean(code);
  if (!value || value.toLowerCase() === "unassigned") {
    throw new Error("Location is required. Select a valid Site/SP/Building/Floor/Room location.");
  }
  const location = await prisma.location.findFirst({
    where: {
      code: { equals: value, mode: "insensitive" },
      active: true,
      outOfService: false,
    },
  });
  if (!location) throw new Error(`Location ${value} was not found or is inactive.`);
  return location;
}

export async function locationHierarchyForCode(code?: string | null, assetTag?: string | null) {
  const location = await requireLocationByCode(code);
  return { location, hierarchy: hierarchyFromLocation(location, assetTag) };
}

export function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(clean).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}
