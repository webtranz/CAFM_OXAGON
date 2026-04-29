import { NextResponse } from "next/server";
import { accessRole } from "@/lib/access-control";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const site = url.searchParams.get("site") || undefined;
  const building = url.searchParams.get("building") || undefined;
  const floor = url.searchParams.get("floor") || undefined;
  const room = url.searchParams.get("room") || undefined;
  const user = await getCurrentUser();
  const role = accessRole(user);
  const where = {
    ...(site ? { siteCode: site } : {}),
    ...(building ? { buildingCode: building } : {}),
    ...(floor ? { floor } : {}),
    ...(room ? { room } : {}),
    ...(role === "supervisor" || role === "technician" ? { departmentCode: user?.department || "__none__" } : {}),
  };
  const assets = await prisma.asset.findMany({
    where,
    orderBy: [{ buildingCode: "asc" }, { floor: "asc" }, { room: "asc" }, { tag: "asc" }],
    select: {
      id: true,
      tag: true,
      name: true,
      assetDescription: true,
      assetGroup: true,
      category: true,
      siteCode: true,
      buildingCode: true,
      floor: true,
      room: true,
      status: true,
      assignedTeamCode: true,
      assignedSupervisorEmail: true,
    },
  });
  return NextResponse.json({ assets });
}
