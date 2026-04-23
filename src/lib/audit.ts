import { prisma } from "@/lib/prisma";

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
  details?: string;
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
        details: details || null,
      },
    });
  } catch {
    // Audit logging must not block the CAFM operation.
  }
}
