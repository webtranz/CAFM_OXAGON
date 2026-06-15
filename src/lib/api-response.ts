import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown, fallback: string, status = 500) {
  const message =
    error instanceof ZodError
      ? error.issues.map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`).join("; ")
      : status >= 500
        ? fallback
      : error instanceof Error
        ? error.message
        : fallback;

  return NextResponse.json(
    {
      message,
    },
    { status },
  );
}
