import { addDays, subDays } from "date-fns";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("cafm12345", 10);
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cafm.local" },
    update: { passwordHash: adminPasswordHash, role: "Admin", active: true },
    create: {
      name: "System Administrator",
      email: "admin@cafm.local",
      role: "Admin",
      department: "Administration",
      passwordHash: adminPasswordHash,
      active: true,
    },
  });

  const permissions = [
    ["assets.manage", "Manage Assets", "Assets", "Create, edit, import and view asset history"],
    ["work.manage", "Manage Work Orders", "Work", "Create and update work orders"],
    ["ppm.manage", "Manage PPM", "Maintenance", "Create planned preventive maintenance schedules"],
    ["users.manage", "Manage Users", "Administration", "Create users and assign roles"],
    ["reports.view", "View Reports", "Reports", "Preview and download reports"],
  ] as const;

  for (const [code, name, module, description] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { name, module, description },
      create: { code, name, module, description },
    });
    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role: "Admin", permissionId: permission.id } },
      update: {},
      create: { role: "Admin", permissionId: permission.id },
    });
  }

  const users = await Promise.all(
    [
      ["Mariam Al-Fahad", "mariam@brightworks.local", "Facility Director", "Operations"],
      ["Omar Siddiqui", "omar@brightworks.local", "Helpdesk Manager", "Tenant Services"],
      ["Adeel Khan", "adeel@brightworks.local", "Technician", "MEP"],
      ["Sara Malik", "sara@brightworks.local", "Technician", "Life Safety"],
    ].map(([name, email, role, department]) =>
      prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, role, department, passwordHash },
      }),
    ),
  );
  users.unshift(admin);

  const mepTeam = await prisma.team.upsert({
    where: { code: "MEP" },
    update: {},
    create: {
      code: "MEP",
      name: "MEP Response Team",
      type: "Hard Services",
      supervisor: "Adeel Khan",
      phone: "+966 500000001",
      email: "mep@brightworks.local",
      shift: "24/7",
      coverage: "All towers and plant rooms",
    },
  });

  await prisma.assetCategory.upsert({
    where: { code: "HVAC" },
    update: {},
    create: {
      code: "HVAC",
      name: "HVAC Equipment",
      type: "MEP",
      defaultLifeYrs: 15,
      statutory: false,
      description: "Cooling, heating and ventilation equipment.",
    },
  });

  await prisma.serviceCatalog.upsert({
    where: { code: "HVAC-REQ" },
    update: {},
    create: {
      code: "HVAC-REQ",
      name: "HVAC Complaint",
      category: "HVAC",
      type: "Reactive",
      priority: "HIGH",
      slaHours: 12,
      teamId: mepTeam.id,
      description: "Temperature, ventilation and indoor air quality requests.",
    },
  });

  const site = await prisma.site.upsert({
    where: { id: "site-riyadh-kafd" },
    update: {},
    create: {
      id: "site-riyadh-kafd",
      name: "King Abdullah Financial District",
      city: "Riyadh",
      country: "Saudi Arabia",
      type: "Mixed Use",
      areaSqm: 284000,
    },
  });

  const towerA = await prisma.building.upsert({
    where: { code: "KAFD-A" },
    update: {},
    create: { name: "Tower A", code: "KAFD-A", siteId: site.id, floors: 42, areaSqm: 92000 },
  });

  await Promise.all(
    [
      ["Main Lobby", "G", "Reception", 280, 1200, 190],
      ["Executive Offices", "18", "Office", 420, 3100, 336],
      ["Basement Plant Room", "B2", "Plant", 35, 2400, 12],
    ].map(([name, floor, type, capacity, areaSqm, occupancy]) =>
      prisma.space.upsert({
        where: { id: `space-${String(name).toLowerCase().replaceAll(" ", "-")}` },
        update: {},
        create: {
          id: `space-${String(name).toLowerCase().replaceAll(" ", "-")}`,
          name: String(name),
          floor: String(floor),
          type: String(type),
          capacity: Number(capacity),
          areaSqm: Number(areaSqm),
          occupancy: Number(occupancy),
          buildingId: towerA.id,
        },
      }),
    ),
  );

  const assetRows = [
    ["AHU-RYD-01-004", "Air Handling Unit 4", "HVAC", "Cooling", "HIGH", "ACTIVE", 88, 145000],
    ["GEN-RYD-02-001", "Emergency Generator 1", "Power", "Electrical", "CRITICAL", "STANDBY", 91, 420000],
    ["FLS-RYD-01-221", "Fire Pump Controller", "Life Safety", "Fire", "CRITICAL", "ACTIVE", 76, 88000],
    ["CHL-RYD-01-002", "Centrifugal Chiller 2", "HVAC", "Cooling", "CRITICAL", "ACTIVE", 72, 980000],
    ["LFT-RYD-A-008", "Passenger Lift 8", "Vertical Transport", "Elevators", "HIGH", "ACTIVE", 83, 360000],
  ] as const;

  const assets = await Promise.all(
    assetRows.map(([tag, name, category, system, criticality, status, conditionScore, purchaseCost]) =>
      prisma.asset.upsert({
        where: { tag },
        update: {},
        create: {
          tag,
          name,
          category,
          system,
          criticality,
          status,
          serialNumber: `${tag}-SN`,
          conditionScore,
          manufacturer: "Enterprise OEM",
          model: "X-Series",
          installDate: subDays(new Date(), 1200),
          replacementDate: addDays(new Date(), 2200),
          warrantyExpiry: addDays(new Date(), 545),
          contractRef: "Integrated Hard Services Contract",
          documentationUrl: "https://example.com/asset-manual.pdf",
          purchaseCost,
          salvageValue: Math.round(purchaseCost * 0.1),
          depreciationRate: 12.5,
          floor: tag.includes("GEN") ? "B2" : "18",
          room: tag.includes("GEN") ? "Generator Room" : "Plant Room",
          qrCode: `CAFM-ASSET:${tag}`,
          siteId: site.id,
          buildingId: towerA.id,
        },
      }),
    ),
  );

  await Promise.all(
    assets.map((asset) =>
      prisma.assetHistory.upsert({
        where: { id: `hist-${asset.tag}` },
        update: {},
        create: {
          id: `hist-${asset.tag}`,
          assetId: asset.id,
          eventType: "COMMISSIONED",
          title: "Asset commissioned",
          details: `${asset.tag} registered with baseline condition score ${asset.conditionScore}.`,
          actor: "System",
        },
      }),
    ),
  );

  await Promise.all(
    ([
      ["SR-24001", "Lobby temperature above comfort range", "HVAC", "Tenant Services", "HIGH", "ASSIGNED", "Tower A Lobby", 12],
      ["SR-24002", "Water leak near pantry", "Plumbing", "Floor Warden", "CRITICAL", "IN_PROGRESS", "Tower A L18", 4],
      ["SR-24003", "Access card reader intermittent", "Security", "Reception", "MEDIUM", "NEW", "Tower A Gate 2", 48],
    ] as const).map(([ticketNo, title, category, requester, priority, status, location, slaHours]) =>
      prisma.serviceRequest.upsert({
        where: { ticketNo },
        update: {},
        create: {
          ticketNo,
          title,
          category,
          requester,
          channel: "Portal",
          priority,
          status,
          location,
          slaHours: Number(slaHours),
          dueAt: addHoursSafe(Number(slaHours)),
          description: `${title} reported from ${location}.`,
        },
      }),
    ),
  );

  await Promise.all(
    [
      { woNo: "WO-81024", title: "Replace AHU filters and rebalance", type: "PPM", priority: "HIGH" as const, status: "IN_PROGRESS" as const, assetId: assets[0].id, assignedToId: users[2].id, cost: 2200 },
      { woNo: "WO-81025", title: "Fire pump weekly test", type: "Inspection", priority: "CRITICAL" as const, status: "ASSIGNED" as const, assetId: assets[2].id, assignedToId: users[3].id, cost: 780 },
      { woNo: "WO-81026", title: "Chiller vibration investigation", type: "Condition Based", priority: "HIGH" as const, status: "TRIAGED" as const, assetId: assets[3].id, assignedToId: users[2].id, cost: 0 },
    ].map((row) =>
      prisma.workOrder.upsert({
        where: { woNo: row.woNo },
        update: {},
        create: {
          woNo: row.woNo,
          title: row.title,
          type: row.type,
          priority: row.priority,
          status: row.status,
          assetId: row.assetId,
          assignedToId: row.assignedToId,
          plannedStart: new Date(),
          dueAt: addDays(new Date(), 2),
          estimatedHours: 4,
          actualHours: row.status === "IN_PROGRESS" ? 1.5 : null,
          cost: row.cost,
          jobPlan: "Inspect, isolate if required, execute checklist, capture readings, update failure codes and attach photos.",
          safetyNotes: "Verify PTW, PPE, access clearance and isolation requirements.",
        },
      }),
    ),
  );

  await Promise.all(
    [
      ["PM-HVAC-001", "Monthly AHU Service", "AHU-RYD-01-004", "Monthly", "Check belts, filters, coils, dampers and vibration."],
      ["PM-FLS-010", "Weekly Fire Pump Test", "FLS-RYD-01-221", "Weekly", "Run pump, verify pressures, alarms, valves and controller logs."],
      ["PM-GEN-003", "Generator Load Run", "GEN-RYD-02-001", "Monthly", "Inspect fuel, batteries, coolant, ATS and run under load."],
    ].map(([code, name, assetTag, frequency, checklist]) =>
      prisma.preventiveMaintenance.upsert({
        where: { code },
        update: {},
        create: { code, name, assetTag, frequency, nextDue: addDays(new Date(), 7), durationHrs: 2, checklist },
      }),
    ),
  );

  const inventory = [
    ["FLT-24X24-MERV13", "MERV 13 Filter", "HVAC", "pcs", 34, 50, 45, "Gulf MEP Supplies"],
    ["LED-PNL-60W", "LED Panel 60W", "Electrical", "pcs", 122, 80, 32, "BrightLine Trading"],
    ["VLV-BALL-2IN", "2 inch Ball Valve", "Plumbing", "pcs", 18, 30, 79, "AquaTech Parts"],
  ] as const;

  await Promise.all(
    inventory.map(([sku, name, category, unit, onHand, reorderPoint, unitCost, vendor]) =>
      prisma.inventoryItem.upsert({
        where: { sku },
        update: {},
        create: { sku, name, category, unit, onHand, reorderPoint, unitCost, vendor, location: "Central Store A" },
      }),
    ),
  );

  const vendor = await prisma.vendor.upsert({
    where: { id: "vendor-gulf-mep" },
    update: {},
    create: {
      id: "vendor-gulf-mep",
      name: "Gulf MEP Services",
      category: "Hard Services",
      rating: 4.7,
      contact: "Nadia Rahman",
      email: "contracts@gulfmep.local",
      phone: "+966 11 555 0199",
    },
  });

  await prisma.contract.upsert({
    where: { id: "contract-hard-services" },
    update: {},
    create: {
      id: "contract-hard-services",
      title: "Integrated Hard Services Contract",
      vendorId: vendor.id,
      type: "FM Maintenance",
      startDate: subDays(new Date(), 180),
      endDate: addDays(new Date(), 545),
      value: 6800000,
      slaTarget: "95% monthly SLA compliance",
    },
  });

  await Promise.all(
    ([
      ["INS-FLS-144", "Fire life safety weekly audit", "All Towers", "Sara Malik", "HIGH", 91, "COMPLETED", "Minor signage issue in stairwell 3."],
      ["INS-HSE-033", "Contractor permit compliance", "Basement Plant", "Mariam Al-Fahad", "MODERATE", 84, "IN_PROGRESS", "Two permits pending supervisor closure."],
    ] as const).map(([code, title, area, inspector, risk, score, status, findings]) =>
      prisma.inspection.upsert({
        where: { code },
        update: {},
        create: { code, title, area, inspector, risk, score: Number(score), status, dueAt: addDays(new Date(), 1), findings },
      }),
    ),
  );

  await prisma.hseIncident.upsert({
    where: { refNo: "HSE-2026-001" },
    update: {},
    create: {
      refNo: "HSE-2026-001",
      title: "Minor slip near loading bay",
      area: "Loading Bay",
      severity: "MODERATE",
      status: "TRIAGED",
      correctiveAction: "Improve floor drying procedure and add temporary warning signage.",
    },
  });

  await prisma.iotAlert.deleteMany({});
  await prisma.meter.deleteMany({});

  await Promise.all(
    ([
      ["BMS", "CHL-RYD-01-002", "HIGH", "Chiller vibration exceeds baseline by 18%", "TRIAGED"],
      ["Energy Meter", "MDB-RYD-03-001", "MEDIUM", "Peak demand forecast breach in 48 hours", "NEW"],
    ] as const).map(([source, assetTag, severity, message, status]) =>
      prisma.iotAlert.create({
        data: { source, assetTag, severity, message, status },
      }),
    ),
  );

  await Promise.all(
    assets.slice(0, 3).map((asset, index) =>
      prisma.meter.create({
        data: {
          name: `${asset.tag} runtime`,
          type: "Runtime",
          unit: "hrs",
          reading: 1200 + index * 240,
          assetId: asset.id,
        },
      }),
    ),
  );
}

function addHoursSafe(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
