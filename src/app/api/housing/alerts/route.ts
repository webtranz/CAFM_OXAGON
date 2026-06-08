import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { auditAction } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { runHousingAlertChecks } from "@/lib/housing-alerts";

export async function GET() {
  return runChecks();
}

export async function POST() {
  return runChecks();
}

async function runChecks() {
  try {
    const user = await getCurrentUser();
    const actor = user?.name || user?.email || "Housing Alert Scheduler";
    const result = await runHousingAlertChecks(actor);
    await auditAction({ user, action: "HOUSING_ALERT_CHECK_RUN", entity: "housing_alerts", entityId: "daily", details: result });
    return NextResponse.json({ ok: true, ...result, schedule: "daily" });
  } catch (error) {
    return apiError(error, "Unable to run housing alert checks");
  }
}
