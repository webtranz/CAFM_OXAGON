import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.string().min(2),
  defaultLifeYrs: z.coerce.number().int().min(1),
  statutory: z.coerce.boolean().optional(),
  description: z.string().optional(),
});

export async function GET() {
  return NextResponse.json(await prisma.assetCategory.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const created = await prisma.assetCategory.upsert({
      where: { code: input.code },
      update: { ...input, description: input.description || "" },
      create: { ...input, description: input.description || "" },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save asset category");
  }
}
