import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const boolValue = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const schema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  assetTag: z.string().optional(),
  frequency: z.string().optional(),
  nextDue: z.string().optional(),
  durationHrs: z.coerce.number().min(0.25).optional(),
  checklist: z.string().optional(),
  active: boolValue.optional(),
});

export async function GET() {
  return NextResponse.json(await prisma.preventiveMaintenance.findMany({ orderBy: { nextDue: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const count = await prisma.preventiveMaintenance.count();
    const code = input.code || `PPM-${String(count + 1).padStart(4, "0")}`;
    const data = {
      code,
      name: input.name || `PPM ${count + 1}`,
      assetTag: input.assetTag || "Unassigned",
      frequency: input.frequency || "Monthly",
      durationHrs: input.durationHrs ?? 1,
      checklist: input.checklist || "Checklist to be defined.",
      nextDue: addDays(new Date(), 7),
      active: true,
    };
    const created = await prisma.preventiveMaintenance.upsert({
      where: { code },
      update: data,
      create: data,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save PPM");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = schema.extend({ id: z.string().optional() }).parse(await request.json());
    const id = input.id || undefined;
    const code = input.code || undefined;
    if (!id && !code) throw new Error("PPM id or code is required");
    const data = {
      name: input.name,
      assetTag: input.assetTag,
      frequency: input.frequency,
      durationHrs: input.durationHrs,
      checklist: input.checklist,
      active: input.active,
      nextDue: input.nextDue ? new Date(input.nextDue) : undefined,
    };
    const updated = await prisma.preventiveMaintenance.update({
      where: id ? { id } : { code: code! },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error, "Unable to update PPM");
  }
}
