import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  departmentName: z.string().optional(),
  departmentCode: z.string().optional(),
  teamCode: z.string().optional(),
  slaHours: z.coerce.number().optional(),
});

async function serviceData(input: z.infer<typeof schema>) {
  const team = input.teamCode ? await prisma.team.findUnique({ where: { code: input.teamCode } }) : null;
  const code = input.departmentCode || undefined;
  const name = input.departmentName || code || "General Service";
  return {
    code,
    name,
    category: name,
    type: "Department Service",
    priority: "MEDIUM" as const,
    slaHours: input.slaHours || 24,
    teamId: team?.id,
    description: `Department ${name}`,
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const service = await prisma.serviceCatalog.update({
      where: { id },
      data: await serviceData(input),
    });
    return NextResponse.json(service);
  } catch (error) {
    return apiError(error, "Unable to update service");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.serviceCatalog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete service");
  }
}
