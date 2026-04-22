import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  teamName: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  departmentName: z.string().min(2).optional(),
  departmentCode: z.string().min(1),
  teamCode: z.string().min(1).optional(),
  companyIdNumber: z.string().optional(),
  service: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  return NextResponse.json(await prisma.team.findMany({ include: { services: true }, orderBy: { name: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const code = input.teamCode || input.departmentCode;
    const name = input.teamName || input.name || input.departmentName || code;
    const service = input.service || input.departmentName || "Service Team";
    const created = await prisma.team.upsert({
      where: { code },
      update: {
        name,
        type: service,
        supervisor: input.companyIdNumber || input.departmentCode,
        phone: input.phone || "",
        email: input.email || "",
        shift: "General",
        coverage: input.departmentCode,
      },
      create: {
        code,
        name,
        type: service,
        supervisor: input.companyIdNumber || input.departmentCode,
        phone: input.phone || "",
        email: input.email || "",
        shift: "General",
        coverage: input.departmentCode,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save team");
  }
}
