import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  siteLocation: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  return NextResponse.json(await prisma.department.findMany({ orderBy: { code: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("users.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const count = await prisma.department.count();
    const code = input.code || `DPT-${String(count + 1).padStart(3, "0")}`;
    const name = input.name || "General Department";
    const department = await prisma.department.upsert({
      where: { code },
      update: { name, siteLocation: input.siteLocation || "Main Site", description: input.description || "" },
      create: { code, name, siteLocation: input.siteLocation || "Main Site", description: input.description || "" },
    });
    await auditAction({ user, action: "DEPARTMENT_SAVE", entity: "department", entityId: department.id, details: { input, savedRecord: department } });
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save department");
  }
}
