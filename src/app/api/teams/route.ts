import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.string().min(2),
  supervisor: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  shift: z.string().optional(),
  coverage: z.string().optional(),
});

export async function GET() {
  return NextResponse.json(await prisma.team.findMany({ include: { services: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const created = await prisma.team.upsert({
      where: { code: input.code },
      update: {
        name: input.name,
        type: input.type,
        supervisor: input.supervisor,
        phone: input.phone || "",
        email: input.email || "",
        shift: input.shift || "General",
        coverage: input.coverage || "Site-wide",
      },
      create: {
        code: input.code,
        name: input.name,
        type: input.type,
        supervisor: input.supervisor,
        phone: input.phone || "",
        email: input.email || "",
        shift: input.shift || "General",
        coverage: input.coverage || "Site-wide",
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save team");
  }
}
