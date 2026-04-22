import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  companyIdNumber: z.string().min(1),
  departmentCode: z.string().min(1),
  service: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  return NextResponse.json(await prisma.team.findMany({ include: { services: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const code = input.departmentCode;
    const created = await prisma.team.upsert({
      where: { code },
      update: {
        name: input.name,
        type: input.service,
        supervisor: input.companyIdNumber,
        phone: input.phone || "",
        email: input.email || "",
        shift: "General",
        coverage: input.service,
      },
      create: {
        code,
        name: input.name,
        type: input.service,
        supervisor: input.companyIdNumber,
        phone: input.phone || "",
        email: input.email || "",
        shift: "General",
        coverage: input.service,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save team");
  }
}
