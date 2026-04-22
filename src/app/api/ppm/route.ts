import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().min(2),
  name: z.string().min(3),
  assetTag: z.string().min(2),
  frequency: z.string().min(2),
  durationHrs: z.coerce.number().min(0.25),
  checklist: z.string().min(3),
});

export async function GET() {
  return NextResponse.json(await prisma.preventiveMaintenance.findMany({ orderBy: { nextDue: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const created = await prisma.preventiveMaintenance.upsert({
      where: { code: input.code },
      update: { ...input, nextDue: addDays(new Date(), 7), active: true },
      create: { ...input, nextDue: addDays(new Date(), 7), active: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save PPM");
  }
}
