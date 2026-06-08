import { prisma } from "@/lib/prisma";

function serializeDetails(details: unknown) {
  if (details === undefined || details === null || details === "") return null;
  if (typeof details === "string") return details;
  return JSON.stringify(details, (_key, value) => {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    return value;
  });
}

export async function auditAction({
  user,
  action,
  entity,
  entityId,
  details,
}: {
  user: { id?: string; name?: string; email?: string; role?: string } | null;
  action: string;
  entity: string;
  entityId: string;
  details?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: user?.id || null,
        actorName: user?.name || user?.email || "System",
        role: user?.role || "System",
        action,
        entity,
        entityId,
        details: serializeDetails({
          at: new Date().toISOString(),
          actor: {
            id: user?.id ?? null,
            name: user?.name ?? null,
            email: user?.email ?? null,
            role: user?.role ?? null,
          },
          details,
        }),
      },
    });
  } catch {
    // Audit logging must not block the CAFM operation.
  }
}
