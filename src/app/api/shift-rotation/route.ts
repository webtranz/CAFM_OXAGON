import { NextResponse } from "next/server";
import { z } from "zod";
import { addDays, format, parseISO } from "date-fns";
import { apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const shiftSchema = z.object({
  name: z.string().min(1),
  shiftType: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  breakDuration: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
});

const rotationSchema = z.object({
  name: z.string().min(1),
  appliesTo: z.enum(["Employee", "Service Team"]),
  shiftSequence: z.string().min(1),
  offDays: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  repeatCycle: z.string().min(1),
  active: z.coerce.boolean().default(true),
});

const rosterSchema = z.object({
  assignmentType: z.enum(["Employee", "Service Team"]),
  employeeId: z.string().optional(),
  teamId: z.string().optional(),
  date: z.string().min(1),
  shiftId: z.string().min(1),
  locationZone: z.string().min(1),
  supervisor: z.string().min(1),
  status: z.enum(["Draft", "Finalized"]).default("Draft"),
  source: z.string().default("Manual"),
});

const eligibilityByShift: Record<string, string[]> = {
  Day: ["Day only", "Day & Night"],
  Night: ["Night only", "Day & Night"],
  General: ["Day only", "Night only", "Day & Night"],
  Custom: ["Day only", "Night only", "Day & Night"],
};

function dayStart(value: string | Date) {
  const date = value instanceof Date ? new Date(value) : parseISO(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function csv(rows: Record<string, unknown>[]) {
  const headers = Object.keys(rows[0] ?? { message: "No data" });
  const body = rows.length ? rows : [{ message: "No data" }];
  return [
    headers.join(","),
    ...body.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
}

function pdfText(value: unknown) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function simplePdf(title: string, rows: Record<string, unknown>[]) {
  const body = rows.length ? rows : [{ message: "No data" }];
  const lines = [
    title,
    "",
    ...body.slice(0, 120).map((row) => Object.values(row).map((value) => String(value ?? "")).join(" | ").slice(0, 145)),
  ];
  const contentLines = ["BT", "/F1 10 Tf", "40 790 Td"];
  lines.forEach((line, index) => {
    if (index > 0) contentLines.push("0 -14 Td");
    contentLines.push(`(${pdfText(line)}) Tj`);
  });
  contentLines.push("ET");
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

async function validateRoster(input: z.infer<typeof rosterSchema>, currentId = "") {
  const shift = await prisma.shiftMaster.findUnique({ where: { id: input.shiftId } });
  if (!shift || !shift.active) throw new Error("Active shift is required.");
  const date = dayStart(input.date);
  const existing = await prisma.rosterEntry.findFirst({
    where: {
      id: currentId ? { not: currentId } : undefined,
      date,
      ...(input.assignmentType === "Employee" ? { employeeId: input.employeeId } : { teamId: input.teamId }),
    },
  });
  if (existing) throw new Error("Double shift assignment is not allowed for the selected date.");

  if (input.assignmentType === "Employee") {
    if (!input.employeeId) throw new Error("Employee is required.");
    const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee || !employee.active) throw new Error("Inactive or missing employee cannot be assigned.");
    if (employee.shiftEligibility === "Not eligible") throw new Error("Employee is not eligible for shift assignment.");
    if (!eligibilityByShift[shift.shiftType]?.includes(employee.shiftEligibility)) throw new Error("Shift is outside employee day/night eligibility.");
  } else {
    if (!input.teamId) throw new Error("Service team is required.");
    const team = await prisma.team.findUnique({ where: { id: input.teamId } });
    if (!team || !team.active) throw new Error("Inactive or missing service team cannot be assigned.");
    if (team.shiftEligibility === "Not eligible") throw new Error("Service team is not eligible for shift assignment.");
    if (!eligibilityByShift[shift.shiftType]?.includes(team.shiftEligibility)) throw new Error("Shift is outside service team day/night eligibility.");
  }
}

async function rosterRows() {
  const rows = await prisma.rosterEntry.findMany({
    include: { employee: true, team: true, shift: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => ({
    Date: format(row.date, "yyyy-MM-dd"),
    Assignment: row.assignmentType,
    Name: row.employee?.name || row.team?.name || "",
    Code: row.employee?.companyId || row.team?.code || "",
    Shift: row.shift.name,
    ShiftType: row.shift.shiftType,
    Location: row.locationZone,
    Supervisor: row.supervisor,
    Status: row.status,
    Source: row.source,
  }));
}

export async function GET(request: Request) {
  const { error } = await requirePermission("users.manage");
  if (error) return error;
  const url = new URL(request.url);
  const report = url.searchParams.get("report") || "roster";
  const formatType = url.searchParams.get("format") || "csv";
  const rows = await rosterRows();
  const filtered = rows.filter((row) => {
    if (report === "daily") return true;
    if (report === "employee-history") return row.Assignment === "Employee";
    if (report === "team-history") return row.Assignment === "Service Team";
    if (report === "coverage") return true;
    return true;
  });
  if (formatType === "pdf") {
    return new NextResponse(simplePdf(`${report} roster`, filtered), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report}-roster.pdf"`,
      },
    });
  }
  const content = csv(filtered);
  const extension = formatType === "pdf" ? "txt" : "csv";
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report}-roster.${formatType === "excel" ? "csv" : extension}"`,
    },
  });
}

export async function POST(request: Request) {
  try {
    const { error, user } = await requirePermission("users.manage");
    if (error) return error;
    const body = await request.json();
    const module = String(body.module || "");

    if (module === "shift") {
      const input = shiftSchema.parse(body);
      const record = await prisma.shiftMaster.upsert({ where: { name: input.name }, update: input, create: input });
      await auditAction({ user, action: "SHIFT_SAVE", entity: "shift_master", entityId: record.id, details: { input } });
      return NextResponse.json(record, { status: 201 });
    }

    if (module === "rotation") {
      const input = rotationSchema.parse(body);
      const record = await prisma.rotationSetup.upsert({
        where: { name: input.name },
        update: { ...input, startDate: dayStart(input.startDate), endDate: input.endDate ? dayStart(input.endDate) : null },
        create: { ...input, startDate: dayStart(input.startDate), endDate: input.endDate ? dayStart(input.endDate) : null },
      });
      await auditAction({ user, action: "ROTATION_SAVE", entity: "rotation_setup", entityId: record.id, details: { input } });
      return NextResponse.json(record, { status: 201 });
    }

    if (module === "roster") {
      const input = rosterSchema.parse(body);
      await validateRoster(input);
      const record = await prisma.rosterEntry.create({ data: { ...input, date: dayStart(input.date), employeeId: input.assignmentType === "Employee" ? input.employeeId : null, teamId: input.assignmentType === "Service Team" ? input.teamId : null } });
      await auditAction({ user, action: "ROSTER_SAVE", entity: "roster_entry", entityId: record.id, details: { input } });
      return NextResponse.json(record, { status: 201 });
    }

    if (module === "finalize") {
      const ids = z.array(z.string()).parse(body.ids || []);
      const rows = await prisma.rosterEntry.findMany({ where: { id: { in: ids } } });
      for (const row of rows) {
        if (!row.employeeId && !row.teamId) throw new Error("Cannot finalize roster with missing assignment.");
        if (!row.shiftId || !row.locationZone || !row.supervisor) throw new Error("Cannot finalize roster with missing required fields.");
      }
      await prisma.rosterEntry.updateMany({ where: { id: { in: ids }, status: "Draft" }, data: { status: "Finalized" } });
      return NextResponse.json({ ok: true, finalized: ids.length });
    }

    if (module === "generate") {
      const rotation = await prisma.rotationSetup.findUnique({ where: { id: String(body.rotationId || "") } });
      if (!rotation || !rotation.active) throw new Error("Active rotation setup is required.");
      const shiftNames = rotation.shiftSequence.split(",").map((item) => item.trim()).filter(Boolean);
      const shifts = await prisma.shiftMaster.findMany({ where: { name: { in: shiftNames }, active: true } });
      if (!shifts.length) throw new Error("Rotation has no active shifts.");
      const start = dayStart(rotation.startDate);
      const days = Math.max(1, Math.min(Number(body.days || 7), 31));
      const created = [];
      for (let index = 0; index < days; index += 1) {
        const shift = shifts[index % shifts.length];
        const date = addDays(start, index);
        const rosterInput = rosterSchema.parse({ ...body, shiftId: shift.id, date: format(date, "yyyy-MM-dd"), status: "Draft", source: `Rotation: ${rotation.name}` });
        await validateRoster(rosterInput);
        created.push(await prisma.rosterEntry.create({ data: { ...rosterInput, date, employeeId: rosterInput.assignmentType === "Employee" ? rosterInput.employeeId : null, teamId: rosterInput.assignmentType === "Service Team" ? rosterInput.teamId : null } }));
      }
      return NextResponse.json({ ok: true, created });
    }

    throw new Error("Unsupported shift rotation action.");
  } catch (error) {
    return apiError(error, "Unable to save shift and rotation data");
  }
}
