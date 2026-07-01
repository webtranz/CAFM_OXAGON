import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { paginationMeta, readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  type: z.string().optional(),
  areaSqm: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pagination = readPagination(url);
  const [total, sites] = await Promise.all([
    prisma.site.count(),
    prisma.site.findMany({
      include: { buildings: { take: 10, orderBy: { code: "asc" } } },
      orderBy: { name: "asc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
  return NextResponse.json({ sites, total, ...paginationMeta(total, pagination) });
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("assets.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.site.count();
    const name = input.name || `Site ${String(count + 1).padStart(3, "0")}`;
    const city = input.city || "Unassigned";
    const country = input.country || "Saudi Arabia";
    const site = await prisma.site.upsert({
      where: { name_city_country: { name, city, country } },
      update: { type: input.type || "Facility", areaSqm: input.areaSqm ?? 0 },
      create: { name, city, country, type: input.type || "Facility", areaSqm: input.areaSqm ?? 0 },
    });
    await auditAction({ user, action: "SITE_SAVE", entity: "site", entityId: site.id, details: { input, savedRecord: site } });
    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save site");
  }
}
