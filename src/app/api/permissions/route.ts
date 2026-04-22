import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [permissions, rolePermissions] = await Promise.all([
    prisma.permission.findMany({ orderBy: [{ module: "asc" }, { name: "asc" }] }),
    prisma.rolePermission.findMany({ include: { permission: true }, orderBy: { role: "asc" } }),
  ]);

  return NextResponse.json({ permissions, rolePermissions });
}
