import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      app: "ok",
      database: "missing",
      message: "DATABASE_URL is not available inside the running container.",
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      app: "ok",
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        app: "ok",
        database: "error",
        message: "Database connection error",
      },
      { status: 503 },
    );
  }
}
