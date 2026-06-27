import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  role: z.string().min(2),
  permissionCodes: z.array(z.string()),
});

function titleCase(value: string) {
  return value
    .split(".")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function permissionMeta(code: string) {
  if (!code.startsWith("section.")) {
    return {
      name: titleCase(code),
      module: "Custom",
      description: `Access permission for ${code}.`,
    };
  }
  const parts = code.replace(/^section\./, "").replace(/\.view$/, "").split(".");
  const midpoint = Math.max(1, Math.floor(parts.length / 2));
  const module = titleCase(parts.slice(0, midpoint).join("."));
  const section = titleCase(parts.slice(midpoint).join("."));
  return {
    name: `View ${section || module}`,
    module: module || "Sections",
    description: `Access ${section || module}.`,
  };
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("roles.manage");
    if (error) return error;
    const input = schema.parse(await request.json());
    const permissionCodes = Array.from(new Set(input.role === "Admin" ? input.permissionCodes : input.permissionCodes.filter((code) => code !== "documents.upload")));
    const existingPermissions = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });
    const existingCodes = new Set(existingPermissions.map((permission) => permission.code));
    const missingCodes = permissionCodes.filter((code) => !existingCodes.has(code));
    if (missingCodes.length) {
      await prisma.permission.createMany({
        data: missingCodes.map((code) => ({
          code,
          ...permissionMeta(code),
        })),
        skipDuplicates: true,
      });
    }
    const permissions = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });
    await prisma.rolePermission.deleteMany({ where: { role: input.role } });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ role: input.role, permissionId: permission.id })),
      skipDuplicates: true,
    });
    await auditAction({
      user,
      action: "ROLE_PERMISSIONS_UPDATE",
      entity: "role_permissions",
      entityId: input.role,
      details: {
        role: input.role,
        requestedPermissionCodes: input.permissionCodes,
        appliedPermissionCodes: permissions.map((permission) => permission.code),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to update role permissions");
  }
}
