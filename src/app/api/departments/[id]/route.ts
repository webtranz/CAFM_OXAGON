import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  siteLocation: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const department = await prisma.department.update({
      where: { id },
      data: {
        code: input.code,
        name: input.name,
        siteLocation: input.siteLocation,
        description: input.description,
      },
    });
    return NextResponse.json(department);
  } catch (error) {
    return apiError(error, "Unable to update department");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete department");
  }
}
