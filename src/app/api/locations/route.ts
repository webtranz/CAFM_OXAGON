import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().optional(),
  site: z.string().optional(),
  zone: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  return NextResponse.json(await prisma.location.findMany({ orderBy: [{ site: "asc" }, { building: "asc" }, { floor: "asc" }, { room: "asc" }] }));
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("requests.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.location.count();
    const code = input.code || `LOC-${String(count + 1).padStart(4, "0")}`;
    const data = {
      code,
      site: input.site || "Main Site",
      zone: input.zone || "General",
      building: input.building || "Building",
      floor: input.floor || "Floor",
      room: input.room || "Room",
      type: input.type || "General",
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
