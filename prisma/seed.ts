import { addDays, subDays } from "date-fns";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetOperationalData() {
  await prisma.housingHistory.deleteMany({});
  await prisma.housingNotification.deleteMany({});
  await prisma.housingApproval.deleteMany({});
  await prisma.housingInventory.deleteMany({});
  await prisma.housingAsset.deleteMany({});
  await prisma.housingInspection.deleteMany({});
  await prisma.housingBooking.deleteMany({});
  await prisma.housingResident.deleteMany({});
  await prisma.housingBed.deleteMany({});
  await prisma.housingRoom.deleteMany({});
  await prisma.housingBlock.deleteMany({});
  await prisma.housingProperty.deleteMany({});
  await prisma.inventoryIssue.deleteMany({});
  await prisma.meter.deleteMany({});
  await prisma.iotAlert.deleteMany({});
  await prisma.hseIncident.deleteMany({});
  await prisma.inspection.deleteMany({});
  await prisma.complianceCertificate.deleteMany({});
  await prisma.preventiveMaintenance.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.assetHistory.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.space.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.site.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.jobPlan.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.serviceCatalog.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.team.deleteMany({ where: { users: { none: {} } } });
}

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD || randomUUID(), 10);
  const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminPasswordHash = await bcrypt.hash(adminInitialPassword || randomUUID(), 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cafm.local" },
    update: {
      role: "Admin",
      active: true,
      ...(adminInitialPassword ? { passwordHash: adminPasswordHash } : {}),
    },
    create: {
      name: "System Administrator",
      email: "admin@cafm.local",
      role: "Admin",
      department: "Administration",
      passwordHash: adminPasswordHash,
      active: true,
    },
  });

  const standardRoles = [
    ["Admin", "Full system administration and configuration"],
    ["Department Supervisor", "Department-restricted request review, conversion, work assignment and PPM visibility"],
    ["Supervisor", "Department supervision, request conversion and work assignment"],
    ["Service Team", "Assigned work execution, status, time, photos and material usage"],
    ["Technician", "Execute assigned tasks only"],
    ["Helpdesk", "Request intake, triage and communication"],
    ["Reception", "Front-desk resident and visitor service request intake"],
    ["Resident", "Resident portal request submission and request tracking"],
    ["Requester", "Create and track service requests"],
    ["Read-only", "View-only access to assets, work orders, history and reports"],
  ] as const;

  for (const [name, description] of standardRoles) {
    await prisma.role.upsert({
      where: { name },
      update: { description, standard: true },
      create: { name, description, standard: true },
    });
  }

  const sectionPermissions = [
    ["section.dashboard.dashboard.view", "View Dashboard", "Dashboard", "Access Dashboard under Dashboard."],
    ["section.tickets.service.requests.view", "View Service Requests", "Tickets", "Access Service Requests under Tickets."],
    ["section.tickets.work.orders.view", "View Work Orders", "Tickets", "Access Work Orders under Tickets."],
    ["section.tickets.job.plans.view", "View Job Plans", "Tickets", "Access Job Plans under Tickets."],
    ["section.tickets.ppm.planner.view", "View PPM Planner", "Tickets", "Access PPM Planner under Tickets."],
    ["section.facility.bookings.facility.report.view", "View Facility Report", "Facility Bookings", "Access Facility Report under Facility Bookings."],
    ["section.facility.bookings.locations.view", "View Locations", "Facility Bookings", "Access Locations under Facility Bookings."],
    ["section.facility.bookings.bookings.report.view", "View Bookings Report", "Facility Bookings", "Access Bookings Report under Facility Bookings."],
    ["section.housing.operations.housing.dashboard.view", "View Housing Dashboard", "Housing Operations", "Access Housing Dashboard under Housing Operations."],
    ["section.housing.operations.accommodation.and.bookings.view", "View Accommodation & Bookings", "Housing Operations", "Access Accommodation & Bookings under Housing Operations."],
    ["section.housing.operations.room.inspections.view", "View Room Inspections", "Housing Operations", "Access Room Inspections under Housing Operations."],
    ["section.housing.operations.housing.assets.view", "View Housing Assets", "Housing Operations", "Access Housing Assets under Housing Operations."],
    ["section.housing.operations.housing.inventory.view", "View Housing Inventory", "Housing Operations", "Access Housing Inventory under Housing Operations."],
    ["section.housing.operations.approvals.and.alerts.view", "View Approvals & Alerts", "Housing Operations", "Access Approvals & Alerts under Housing Operations."],
    ["section.housing.operations.notification.settings.view", "View Notification Settings", "Housing Operations", "Access Notification Settings under Housing Operations."],
    ["section.housing.operations.housing.reports.view", "View Housing Reports", "Housing Operations", "Access Housing Reports under Housing Operations."],
    ["section.assets.management.assets.management.view", "View Assets Management", "Assets Management", "Access Assets Management under Assets Management."],
    ["section.assets.management.bulk.upload.assets.view", "View Bulk Upload Assets", "Assets Management", "Access Bulk Upload Assets under Assets Management."],
    ["section.assets.management.asset.inventory.allocation.view", "View Asset Inventory Allocation", "Assets Management", "Access Asset Inventory Allocation under Assets Management."],
    ["section.inventory.management.inventory.view", "View Inventory", "Inventory Management", "Access Inventory under Inventory Management."],
    ["section.inventory.management.bulk.upload.inventory.view", "View Bulk Upload Inventory", "Inventory Management", "Access Bulk Upload Inventory under Inventory Management."],
    ["section.inventory.management.inventory.reports.view", "View Inventory Reports", "Inventory Management", "Access Inventory Reports under Inventory Management."],
    ["section.safety.hse.view", "View HSE", "Safety", "Access HSE under Safety."],
    ["section.safety.iot.bms.view", "View IoT / BMS", "Safety", "Access IoT / BMS under Safety."],
    ["section.compliance.and.certification.compliance.dashboard.view", "View Compliance Dashboard", "Compliance & Certification", "Access Compliance Dashboard under Compliance & Certification."],
    ["section.compliance.and.certification.certification.register.view", "View Certification Register", "Compliance & Certification", "Access Certification Register under Compliance & Certification."],
    ["section.compliance.and.certification.non.compliance.management.view", "View Non-Compliance Management", "Compliance & Certification", "Access Non-Compliance Management under Compliance & Certification."],
    ["section.compliance.and.certification.audit.calendar.view", "View Audit Calendar", "Compliance & Certification", "Access Audit Calendar under Compliance & Certification."],
    ["section.compliance.and.certification.expiry.alerts.view", "View Expiry Alerts", "Compliance & Certification", "Access Expiry Alerts under Compliance & Certification."],
    ["section.document.management.operation.and.maintenance.manuals.view", "View Operation & Maintenance Manuals", "Document Management", "Access Operation & Maintenance Manuals under Document Management."],
    ["section.document.management.equipment.warranties.and.guarantees.view", "View Equipment Warranties and Guarantees", "Document Management", "Access Equipment Warranties and Guarantees under Document Management."],
    ["section.document.management.support.contracts.and.slas.view", "View Support Contracts and SLAs", "Document Management", "Access Support Contracts and SLAs under Document Management."],
    ["section.incident.and.case.management.incident.and.case.management.view", "View Incident & Case Management", "Incident & Case Management", "Access Incident & Case Management under Incident & Case Management."],
    ["section.resource.management.employees.view", "View Employees", "Resource Management", "Access Employees under Resource Management."],
    ["section.resource.management.shifts.and.rotations.view", "View Shifts & Rotations", "Resource Management", "Access Shifts & Rotations under Resource Management."],
    ["section.resource.management.time.sheets.view", "View Time Sheets", "Resource Management", "Access Time Sheets under Resource Management."],
    ["section.resource.management.roles.and.permissions.view", "View Roles & Permissions", "Resource Management", "Access Roles & Permissions under Resource Management."],
    ["section.services.department.codes.view", "View Department Codes", "Services", "Access Department Codes under Services."],
    ["section.services.create.team.code.view", "View Create Team Code", "Services", "Access Create Team Code under Services."],
    ["section.services.service.teams.view", "View Service Teams", "Services", "Access Service Teams under Services."],
    ["section.services.services.catalog.view", "View Services Catalog", "Services", "Access Services Catalog under Services."],
    ["section.services.bulk.upload.services.view", "View Bulk Upload Services", "Services", "Access Bulk Upload Services under Services."],
    ["section.users.management.users.management.view", "View Users Management", "Users Management", "Access Users Management under Users Management."],
    ["section.users.management.permissions.view", "View Permissions", "Users Management", "Access Permissions under Users Management."],
    ["section.utilities.bulk.upload.center.view", "View Bulk Upload Center", "Utilities", "Access Bulk Upload Center under Utilities."],
    ["section.utilities.bulk.upload.templates.view", "View Bulk Upload Templates", "Utilities", "Access Bulk Upload Templates under Utilities."],
    ["section.utilities.csv.excel.pdf.reports.view", "View CSV / Excel / PDF Reports", "Utilities", "Access CSV / Excel / PDF Reports under Utilities."],
    ["section.activity.logs.audit.logs.view", "View Audit Logs", "Activity Logs", "Access Audit Logs under Activity Logs."],
    ["section.activity.logs.reports.preview.view", "View Reports Preview", "Activity Logs", "Access Reports Preview under Activity Logs."],
  ] as const;
  const actionPermissions = [
    ["assets.manage", "Manage Assets", "Assets Management", "Create, edit, import and view asset history"],
    ["work.manage", "Manage Work Orders", "Tickets", "Create and update work orders"],
    ["work.execute", "Execute Work Orders", "Tickets", "Update status, time, photos, assets and inventory used"],
    ["requests.manage", "Manage Service Requests", "Tickets", "Create, edit, assign and convert requests to work orders"],
    ["requests.approve", "Approve or Reject Requests", "Tickets", "Supervisor/helpdesk review, validate, approve or reject service requests"],
    ["requests.view", "View Service Requests", "Tickets", "View assigned service requests"],
    ["work.assign", "Assign Work Orders", "Tickets", "Assign work orders to technicians or teams"],
    ["work.verify", "Verify Completed Work", "Tickets", "Approve, reject, reopen or close completed work"],
    ["ppm.manage", "Manage PPM", "Tickets", "Create planned preventive maintenance schedules"],
    ["users.manage", "Manage Users", "Users Management", "Create users and assign roles"],
    ["roles.manage", "Manage Roles", "Users Management", "Create custom roles and permission sets"],
    ["reports.view", "View Reports", "Utilities", "Preview and download reports"],
    ["assets.view", "View Assets", "Assets Management", "View asset register, history and location drill-down"],
    ["work.view", "View Work Orders", "Tickets", "View work order panels and completion history"],
    ["reception.manage", "Reception Desk", "Reception", "Create resident requests and view front-desk queue"],
    ["resident.portal", "Resident Portal", "Resident", "Create and track own requests"],
    ["housing.manage", "Manage Housing Operations", "Housing Operations", "Create and manage accommodation, bookings, inspections, assets and inventory"],
    ["housing.approve", "Approve Housing Requests", "Housing Operations", "Approve or reject housing bookings and escalations"],
    ["housing.view", "View Housing", "Housing Operations", "View housing dashboards, room history, reports and alerts"],
    ["compliance.manage", "Manage Compliance & Certification", "Compliance & Certification", "Create and renew statutory certificates, permits and regulatory audits"],
    ["compliance.view", "View Compliance & Certification", "Compliance & Certification", "View compliance dashboard, certificate register, expiry alerts and reports"],
    ["documents.upload", "Upload Document Files", "Document Management", "Upload files to document management folders. Admin only."],
  ] as const;
  const permissions = [...sectionPermissions, ...actionPermissions] as const;

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

  const defaultRolePermissions: Record<string, string[]> = {
    Supervisor: ["work.manage", "work.assign", "work.verify", "work.execute", "requests.manage", "requests.approve", "requests.view", "housing.manage", "housing.approve", "housing.view", "compliance.manage", "compliance.view", "reports.view"],
    "Department Supervisor": ["work.manage", "work.assign", "work.verify", "work.execute", "requests.manage", "requests.approve", "requests.view", "ppm.manage", "housing.manage", "housing.approve", "housing.view", "compliance.manage", "compliance.view", "reports.view"],
    "Service Team": ["work.execute", "requests.view", "housing.view", "compliance.view"],
    Technician: ["work.execute", "requests.view"],
    Helpdesk: ["requests.manage", "requests.approve", "requests.view", "housing.view", "compliance.view", "reports.view"],
    Reception: ["reception.manage", "requests.manage", "requests.view", "housing.manage", "housing.view", "compliance.view"],
    Resident: ["resident.portal", "requests.view", "housing.view"],
    Requester: ["resident.portal", "requests.view"],
    "Read-only": ["assets.view", "work.view", "requests.view", "reports.view", "housing.view", "compliance.view"],
  };

  for (const [role, codes] of Object.entries(defaultRolePermissions)) {
    const linkedPermissions = await prisma.permission.findMany({ where: { code: { in: codes } } });
    for (const permission of linkedPermissions) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permission.id } },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
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

  await resetOperationalData();

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
  const electricalTeam = await prisma.team.upsert({
    where: { code: "ELEC" },
    update: {},
    create: {
      code: "ELEC",
      name: "Electrical Response Team",
      type: "Hard Services",
      supervisor: "Mariam Al-Fahad",
      phone: "+966 500000002",
      email: "electrical@tamimiglobal.local",
      shift: "Day + On-call",
      coverage: "Electrical rooms, DBs, generators and UPS",
    },
  });
  const civilTeam = await prisma.team.upsert({
    where: { code: "CIVIL" },
    update: {},
    create: {
      code: "CIVIL",
      name: "Civil & Fitout Team",
      type: "Soft / Civil Services",
      supervisor: "Omar Siddiqui",
      phone: "+966 500000003",
      email: "civil@tamimiglobal.local",
      shift: "Day shift",
      coverage: "Finishes, doors, ceilings, rooms and occupancy support",
    },
  });
  const housekeepingTeam = await prisma.team.upsert({
    where: { code: "HK" },
    update: {},
    create: {
      code: "HK",
      name: "Housekeeping Team",
      type: "Soft Services",
      supervisor: "Omar Siddiqui",
      phone: "+966 500000004",
      email: "housekeeping@tamimiglobal.local",
      shift: "Two shifts",
      coverage: "Public areas, offices, washrooms and pantry spaces",
    },
  });

  await Promise.all(
    [
      ["MEP", "MEP Department", "Tower A", "Mechanical, electrical and plumbing services."],
      ["ELEC", "Electrical Department", "Tower A", "Power distribution, lighting, UPS, generators and panels."],
      ["CIVIL", "Civil Department", "Tower A", "Fitout, finishes, rooms, doors and small civil repairs."],
      ["HK", "Housekeeping Department", "Tower A", "Cleaning, waste, pantry and public area upkeep."],
      ["SEC", "Security Department", "Tower A", "Access control, visitor support and security equipment coordination."],
    ].map(([code, name, siteLocation, description]) =>
      prisma.department.upsert({
        where: { code },
        update: { name, siteLocation, description },
        create: { code, name, siteLocation, description },
      }),
    ),
  );

  await prisma.employee.upsert({
    where: { companyId: "EMP-001" },
    update: {},
    create: {
      name: "Adeel Khan",
      email: "adeel.employee@brightworks.local",
      companyId: "EMP-001",
      nationalityType: "Resident",
      departmentCode: "MEP",
      siteLocation: "Tower A",
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
  await Promise.all(
    [
      ["ELEC", "Electrical Equipment", "Electrical", 20, false, "Panels, DBs, UPS, lighting and generators."],
      ["PLUMB", "Plumbing Equipment", "Plumbing", 15, false, "Pumps, tanks, valves and domestic water assets."],
      ["FLS", "Fire & Life Safety", "Life Safety", 12, true, "Fire pumps, panels, extinguishers and emergency systems."],
      ["FURN", "Furniture & Fixtures", "Civil", 10, false, "Furniture, fixtures, room equipment and occupancy assets."],
      ["IT", "IT Infrastructure", "IT", 7, false, "Network racks, access points, CCTV and IT devices."],
    ].map(([code, name, type, defaultLifeYrs, statutory, description]) =>
      prisma.assetCategory.upsert({
        where: { code: String(code) },
        update: {},
        create: {
          code: String(code),
          name: String(name),
          type: String(type),
          defaultLifeYrs: Number(defaultLifeYrs),
          statutory: Boolean(statutory),
          description: String(description),
        },
      }),
    ),
  );

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
  await Promise.all(
    [
      ["ELEC-REQ", "Electrical Fault", "Electrical", "Reactive", "HIGH", 8, electricalTeam.id, "Lighting, power socket, panel and breaker faults."],
      ["PLUMB-REQ", "Plumbing Leak", "Plumbing", "Reactive", "CRITICAL", 4, mepTeam.id, "Leaks, blockages, valves, pumps and water system faults."],
      ["CIVIL-REQ", "Civil Repair", "Civil", "Reactive", "MEDIUM", 24, civilTeam.id, "Doors, ceilings, gypsum, paint, flooring and furniture defects."],
      ["HK-REQ", "Housekeeping Request", "Housekeeping", "Service", "LOW", 12, housekeepingTeam.id, "Cleaning, waste removal, spills and pantry service."],
      ["SEC-REQ", "Access Control", "Security", "Reactive", "MEDIUM", 12, electricalTeam.id, "Access reader, door maglock and security system coordination."],
    ].map(([code, name, category, type, priority, slaHours, teamId, description]) =>
      prisma.serviceCatalog.upsert({
        where: { code: String(code) },
        update: {},
        create: {
          code: String(code),
          name: String(name),
          category: String(category),
          type: String(type),
          priority: priority as any,
          slaHours: Number(slaHours),
          teamId: String(teamId),
          description: String(description),
        },
      }),
    ),
  );

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
    ["AHU-RYD-01-004", "Air Handling Unit 4", "HVAC", "Cooling", "HIGH", "ACTIVE", 88, 145000, "MEP", "mariam@brightworks.local", "18", "Plant Room"],
    ["GEN-RYD-02-001", "Emergency Generator 1", "ELEC", "Electrical", "CRITICAL", "STANDBY", 91, 420000, "ELEC", "mariam@brightworks.local", "B2", "Generator Room"],
    ["FLS-RYD-01-221", "Fire Pump Controller", "FLS", "Fire", "CRITICAL", "ACTIVE", 76, 88000, "MEP", "sara@brightworks.local", "B2", "Fire Pump Room"],
    ["CHL-RYD-01-002", "Centrifugal Chiller 2", "HVAC", "Cooling", "CRITICAL", "ACTIVE", 72, 980000, "MEP", "mariam@brightworks.local", "B2", "Chiller Plant"],
    ["LFT-RYD-A-008", "Passenger Lift 8", "ELEC", "Elevators", "HIGH", "ACTIVE", 83, 360000, "ELEC", "mariam@brightworks.local", "G", "Lift Lobby"],
    ["FUR-RYD-18-044", "Executive Desk 44", "FURN", "Furniture", "LOW", "ACTIVE", 95, 9500, "CIVIL", "omar@brightworks.local", "18", "Executive Offices"],
    ["IT-RYD-18-AP12", "Wireless Access Point 12", "IT", "Network", "MEDIUM", "ACTIVE", 89, 2800, "ELEC", "mariam@brightworks.local", "18", "Executive Offices"],
  ] as const;

  const assets = await Promise.all(
    assetRows.map(([tag, name, category, system, criticality, status, conditionScore, purchaseCost, assignedTeamCode, assignedSupervisorEmail, floor, room]) =>
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
          siteCode: "169",
          zone: "CB",
          buildingCode: "CB04",
          assetGroup: tag.includes("AHU") ? "AHU" : category,
          assetDescription: name,
          additionalDescription: system,
          parentAsset: "TOP LEVEL",
          departmentCode: assignedTeamCode,
          assignedTeamCode,
          assignedSupervisorEmail,
          remarks: "Seeded from CAFM baseline.",
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
          floor,
          room,
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
      ["SR-24001", "Lobby temperature above comfort range", "HVAC", "MEP", "HVAC-REQ", "MEP", "mariam@brightworks.local", "Tenant Services", "HIGH", "ASSIGNED", "Tower A > G > Main Lobby", 12],
      ["SR-24002", "Water leak near pantry", "Plumbing", "MEP", "PLUMB-REQ", "MEP", "mariam@brightworks.local", "Floor Warden", "CRITICAL", "IN_PROGRESS", "Tower A > 18 > Pantry", 4],
      ["SR-24003", "Access card reader intermittent", "Security", "SEC", "SEC-REQ", "ELEC", "mariam@brightworks.local", "Reception", "MEDIUM", "NEW", "Tower A > G > Main Lobby", 48],
      ["SR-24004", "Ceiling tile damaged in office", "Civil", "CIVIL", "CIVIL-REQ", "CIVIL", "omar@brightworks.local", "Admin Office", "LOW", "APPROVED", "Tower A > 18 > Executive Offices", 36],
      ["SR-24005", "Washroom cleaning required", "Housekeeping", "HK", "HK-REQ", "HK", "omar@brightworks.local", "Resident", "MEDIUM", "NEW", "Tower A > 18 > Pantry", 8],
    ] as const).map(([ticketNo, title, category, departmentCode, serviceCode, assignedTeamCode, assignedSupervisorEmail, requester, priority, status, location, slaHours]) =>
      prisma.serviceRequest.upsert({
        where: { ticketNo },
        update: {},
        create: {
          ticketNo,
          title,
          category,
          departmentCode,
          serviceCode,
          assignedTeamCode,
          assignedSupervisorEmail,
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
      { woNo: "WO-81024", title: "Replace AHU filters and rebalance", type: "PPM", priority: "HIGH" as const, status: "IN_PROGRESS" as const, assetId: assets[0].id, departmentCode: "MEP", serviceCode: "HVAC-REQ", assignedTeamCode: "MEP", jobPlanCode: "JP-HVAC-FILTER", assignedToId: users[2].id, cost: 2200, inventoryUsed: "FLT-24X24-MERV13:2", workNotes: "Technician responded and AHU isolation is complete." },
      { woNo: "WO-81025", title: "Fire pump weekly test", type: "Inspection", priority: "CRITICAL" as const, status: "ASSIGNED" as const, assetId: assets[2].id, departmentCode: "MEP", serviceCode: "PLUMB-REQ", assignedTeamCode: "MEP", jobPlanCode: "JP-FLS-PUMP", assignedToId: users[3].id, cost: 780, inventoryUsed: "", workNotes: "" },
      { woNo: "WO-81026", title: "Chiller vibration investigation", type: "Condition Based", priority: "HIGH" as const, status: "TRIAGED" as const, assetId: assets[3].id, departmentCode: "MEP", serviceCode: "HVAC-REQ", assignedTeamCode: "MEP", jobPlanCode: "JP-CHILLER-CB", assignedToId: users[2].id, cost: 0, inventoryUsed: "", workNotes: "" },
      { woNo: "WO-81027", title: "Replace failed LED panel", type: "Corrective", priority: "MEDIUM" as const, status: "PENDING_SUPERVISOR_REVIEW" as const, assetId: assets[6].id, departmentCode: "ELEC", serviceCode: "ELEC-REQ", assignedTeamCode: "ELEC", jobPlanCode: "JP-ELEC-LIGHT", assignedToId: users[2].id, cost: 320, inventoryUsed: "LED-PNL-60W:1", workNotes: "Panel replaced and tested. Awaiting supervisor closure." },
      { woNo: "WO-81028", title: "Repair executive office desk drawer", type: "Corrective", priority: "LOW" as const, status: "CLOSED" as const, assetId: assets[5].id, departmentCode: "CIVIL", serviceCode: "CIVIL-REQ", assignedTeamCode: "CIVIL", jobPlanCode: "JP-CIVIL-FIX", assignedToId: users[1].id, cost: 140, inventoryUsed: "", workNotes: "Drawer rails adjusted and work verified." },
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
          departmentCode: row.departmentCode,
          serviceCode: row.serviceCode,
          assignedTeamCode: row.assignedTeamCode,
          jobPlanCode: row.jobPlanCode,
          assignedToId: row.assignedToId,
          plannedStart: new Date(),
          dueAt: addDays(new Date(), 2),
          estimatedHours: 4,
          actualHours: row.status === "IN_PROGRESS" ? 1.5 : null,
          cost: row.cost,
          responseAt: ["IN_PROGRESS", "PENDING_SUPERVISOR_REVIEW", "CLOSED"].includes(row.status) ? subDays(new Date(), 1) : null,
          resolutionAt: ["PENDING_SUPERVISOR_REVIEW", "CLOSED"].includes(row.status) ? new Date() : null,
          finishedAt: row.status === "CLOSED" ? new Date() : null,
          inventoryUsed: row.inventoryUsed,
          workNotes: row.workNotes,
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

  await Promise.all(
    [
      ["KAFD-A-G-LOBBY", "King Abdullah Financial District", "CB", "Tower A", "G", "Main Lobby", "Public", "Main reception and visitor lobby."],
      ["KAFD-A-18-PLANT", "King Abdullah Financial District", "CB", "Tower A", "18", "Plant Room", "Plant", "Primary MEP plant room for Tower A level 18."],
      ["KAFD-A-18-OFFICE", "King Abdullah Financial District", "CB", "Tower A", "18", "Executive Offices", "Office", "Executive office suite and meeting rooms."],
      ["KAFD-A-B2-GEN", "King Abdullah Financial District", "CB", "Tower A", "B2", "Generator Room", "Plant", "Emergency generator room."],
      ["KAFD-A-B2-FIRE", "King Abdullah Financial District", "CB", "Tower A", "B2", "Fire Pump Room", "Life Safety", "Fire pump and controller room."],
      ["KAFD-A-B2-CHILLER", "King Abdullah Financial District", "CB", "Tower A", "B2", "Chiller Plant", "Plant", "Chiller and chilled water plant space."],
      ["KAFD-A-G-LIFT", "King Abdullah Financial District", "CB", "Tower A", "G", "Lift Lobby", "Vertical Transport", "Passenger lift lobby."],
      ["KAFD-A-18-PANTRY", "King Abdullah Financial District", "CB", "Tower A", "18", "Pantry", "Support", "Floor pantry and small wet area."],
    ].map(([code, siteName, zone, building, floor, room, type, description]) =>
      prisma.location.upsert({
        where: { code: String(code) },
        update: {},
        create: {
          code: String(code),
          site: String(siteName),
          zone: String(zone),
          building: String(building),
          floor: String(floor),
          room: String(room),
          type: String(type),
          description: String(description),
        },
      }),
    ),
  );

  await Promise.all(
    [
      ["JP-HVAC-FILTER", "AHU Filter Replacement", "HVAC", "MEP", "HVAC-REQ", 2, "MEDIUM", "Inspect filter bank, isolate AHU if required, replace filters, clean frame, verify differential pressure and update asset history.", "Use PPE, check access permit and verify safe access before removing filters."],
      ["JP-FLS-PUMP", "Fire Pump Weekly Test", "FLS", "MEP", "PLUMB-REQ", 1.5, "CRITICAL", "Check controller, run pump, record suction/discharge pressure, verify jockey pump and alarms.", "Notify control room before test and follow fire system bypass process."],
      ["JP-CHILLER-CB", "Chiller Condition Investigation", "HVAC", "MEP", "HVAC-REQ", 4, "HIGH", "Review BMS trend, inspect vibration, check oil and temperatures, record corrective recommendation.", "Use hearing protection and follow rotating equipment precautions."],
      ["JP-ELEC-LIGHT", "Lighting Panel Replacement", "ELEC", "ELEC", "ELEC-REQ", 1, "MEDIUM", "Isolate circuit, replace panel/light fitting, test lux level and restore circuit.", "Lockout/tagout the circuit and verify dead before touching wiring."],
      ["JP-CIVIL-FIX", "Civil Minor Repair", "FURN", "CIVIL", "CIVIL-REQ", 2, "LOW", "Inspect defect, repair/replace fixture, clean area and confirm user acceptance.", "Use hand tools safely and protect surrounding finishes."],
    ].map(([code, name, assetType, departmentCode, serviceCode, estimatedHours, priority, steps, safetyNotes]) =>
      prisma.jobPlan.upsert({
        where: { code: String(code) },
        update: {},
        create: {
          code: String(code),
          name: String(name),
          assetType: String(assetType),
          departmentCode: String(departmentCode),
          serviceCode: String(serviceCode),
          estimatedHours: Number(estimatedHours),
          priority: priority as any,
          steps: String(steps),
          safetyNotes: String(safetyNotes),
        },
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

  const seededIssues = [
    ["FLT-24X24-MERV13", "WO-81024", 2],
    ["LED-PNL-60W", "WO-81027", 1],
  ] as const;
  for (const [sku, woNo, quantity] of seededIssues) {
    const [item, work] = await Promise.all([
      prisma.inventoryItem.findUnique({ where: { sku } }),
      prisma.workOrder.findUnique({ where: { woNo } }),
    ]);
    if (item && work) {
      await prisma.inventoryIssue.create({ data: { itemId: item.id, workId: work.id, quantity } });
      await prisma.inventoryItem.update({ where: { id: item.id }, data: { onHand: Math.max(0, item.onHand - quantity) } });
    }
  }

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

  await Promise.all(
    ([
      ["CERT-FLS-2026-001", "Fire Alarm Civil Defense Certificate", "Civil Defense", "Life Safety", "FLS-RYD-01-221", "Tower A", "HSE Manager", -320, 45, "ACTIVE", "HIGH", 30, "Annual Civil Defense certificate with renewal required before expiry."],
      ["CERT-LIFT-2026-004", "Elevator Third Party Inspection", "TUV", "Vertical Transport", "LIFT-TWA-04", "Tower A", "Facilities Supervisor", -90, 12, "EXPIRING_SOON", "MODERATE", 30, "Third-party inspection due for renewal this month."],
      ["CERT-GEN-2026-002", "Emergency Generator Load Test Certificate", "Authorized Testing Body", "Electrical", "GEN-RYD-02-001", "Generator Room", "Electrical Supervisor", -180, 120, "ACTIVE", "HIGH", 45, "Quarterly generator load bank certificate and evidence file."],
    ] as const).map(([certificateNo, title, authority, category, assetTag, location, owner, issueOffset, expiryOffset, status, risk, renewalLeadDays, notes]) =>
      prisma.complianceCertificate.upsert({
        where: { certificateNo },
        update: { title, authority, category, assetTag, location, owner, issueDate: addDays(new Date(), Number(issueOffset)), expiryDate: addDays(new Date(), Number(expiryOffset)), status, risk, renewalLeadDays: Number(renewalLeadDays), notes },
        create: { certificateNo, title, authority, category, assetTag, location, owner, issueDate: addDays(new Date(), Number(issueOffset)), expiryDate: addDays(new Date(), Number(expiryOffset)), status, risk, renewalLeadDays: Number(renewalLeadDays), evidenceUrl: "", notes },
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

  const housingProperty = await prisma.housingProperty.upsert({
    where: { code: "HSP-001" },
    update: {},
    create: {
      code: "HSP-001",
      name: "Tamimi Global Housing Village",
      site: "Jazan Operations Camp",
      city: "Jazan",
      manager: "Housing Supervisor",
      totalRooms: 6,
    },
  });
  const housingBlock = await prisma.housingBlock.upsert({
    where: { code: "HSB-A" },
    update: {},
    create: { code: "HSB-A", name: "Block A", propertyId: housingProperty.id, floors: 3 },
  });

  const housingRooms = [] as Awaited<ReturnType<typeof prisma.housingRoom.upsert>>[];
  for (const [code, roomNumber, floor, roomType, capacity, occupancy, status] of [
    ["HSR-A101", "A101", "1", "Single Executive", 1, 1, "OCCUPIED"],
    ["HSR-A102", "A102", "1", "Shared Technician", 2, 1, "RESERVED"],
    ["HSR-A201", "A201", "2", "Shared Technician", 2, 0, "AVAILABLE"],
    ["HSR-A202", "A202", "2", "Isolation / Maintenance", 1, 0, "MAINTENANCE"],
  ] as const) {
    const room = await prisma.housingRoom.upsert({
      where: { code },
      update: {},
      create: {
        code,
        roomNumber,
        propertyId: housingProperty.id,
        blockId: housingBlock.id,
        floor,
        roomType,
        capacity,
        occupancy,
        status,
        qrCode: `QR:${code}`,
        remarks: `${roomType} room for CAFM housing operation testing.`,
      },
    });
    housingRooms.push(room);
    for (let index = 1; index <= capacity; index += 1) {
      await prisma.housingBed.upsert({
        where: { code: `${code}-B${index}` },
        update: {},
        create: {
          code: `${code}-B${index}`,
          label: `Bed ${index}`,
          roomId: room.id,
          status: index <= occupancy ? (status === "OCCUPIED" ? "OCCUPIED" : "RESERVED") : "AVAILABLE",
          occupant: index <= occupancy ? (index === 1 ? "Hamayun Ali" : "Resident") : "",
        },
      });
    }
  }

  const resident = await prisma.housingResident.upsert({
    where: { residentNo: "RES-00001" },
    update: {},
    create: {
      residentNo: "RES-00001",
      name: "Hamayun Ali",
      email: "hamayun.resident@tamimiglobal.local",
      phone: "+966 500000101",
      companyId: "TG-EMP-001",
      nationality: "Pakistan",
      departmentCode: "MEP",
    },
  });
  const bed = await prisma.housingBed.findFirst({ where: { roomId: housingRooms[0].id } });
  const booking = await prisma.housingBooking.upsert({
    where: { bookingNo: "HBK-00001" },
    update: {},
    create: {
      bookingNo: "HBK-00001",
      residentId: resident.id,
      residentName: resident.name,
      departmentCode: "MEP",
      roomId: housingRooms[0].id,
      bedId: bed?.id,
      checkIn: subDays(new Date(), 2),
      status: "CHECKED_IN",
      priority: "MEDIUM",
      requestedBy: "Reception",
      approvedBy: "Housing Supervisor",
      approvalLevel: "Supervisor",
      notes: "Seed booking for end-to-end housing workflow verification.",
    },
  });
  await prisma.housingApproval.create({
    data: { entity: "booking", entityId: booking.id, bookingId: booking.id, level: "Supervisor", approver: "Housing Supervisor", status: "APPROVED", remarks: "Approved sample booking." },
  });
  await prisma.housingNotification.create({
    data: { title: "Housing inspection due", message: "Room A102 check-in inspection is due today.", severity: "MEDIUM", recipient: "Housing Supervisor", bookingId: booking.id },
  });
  await prisma.housingInspection.upsert({
    where: { inspectionNo: "HIN-00001" },
    update: {},
    create: {
      inspectionNo: "HIN-00001",
      roomId: housingRooms[1].id,
      inspector: "Housing Supervisor",
      inspectionType: "Check-in Readiness",
      status: "SCHEDULED",
      score: 92,
      findings: "Verify linen, HVAC thermostat and washroom fittings before occupancy.",
      dueAt: addDays(new Date(), 1),
    },
  });
  await prisma.housingAsset.upsert({
    where: { tag: "HSA-BED-A101" },
    update: {},
    create: {
      tag: "HSA-BED-A101",
      name: "Executive Bed Frame",
      category: "Furniture",
      roomId: housingRooms[0].id,
      status: "ACTIVE",
      serialNumber: "BED-A101-01",
      warrantyExpiry: addDays(new Date(), 365),
      qrCode: "QR:HSA-BED-A101",
    },
  });
  await prisma.housingInventory.upsert({
    where: { sku: "HSI-LINEN-SET" },
    update: {},
    create: {
      sku: "HSI-LINEN-SET",
      name: "Linen Set",
      category: "Linen",
      description: "Complete bed linen issue set for resident rooms.",
      roomId: housingRooms[0].id,
      storeLocation: "Housing Store / Linen Rack A",
      onHand: 48,
      minimumStock: 25,
      reorderPoint: 20,
      unit: "Set",
      unitCost: 42,
      supplierName: "Tamimi Housekeeping Supplies",
      supplierContact: "housing.supplies@tamimi.local",
      preferredSupplier: "Tamimi Housekeeping Supplies",
      expiryDate: addDays(new Date(), 365),
      lastMovementType: "RECEIPT",
      lastMovementQty: 48,
      lastMovementAt: new Date(),
      lastMovementBy: "System",
      purchaseRequestStatus: "NOT_REQUIRED",
      qrCode: "QR:HSI-LINEN-SET",
    },
  });
  await prisma.housingInventory.upsert({
    where: { sku: "HSI-PPE-GLOVE" },
    update: {},
    create: {
      sku: "HSI-PPE-GLOVE",
      name: "Disposable Gloves",
      category: "PPE items",
      description: "PPE gloves for housekeeping and inspection teams.",
      storeLocation: "Housing Store / PPE Shelf",
      onHand: 8,
      minimumStock: 20,
      reorderPoint: 30,
      unit: "Box",
      unitCost: 18,
      supplierName: "Safety First Trading",
      supplierContact: "+966 11 555 0201",
      preferredSupplier: "Safety First Trading",
      expiryDate: addDays(new Date(), -5),
      lastMovementType: "ISSUE",
      lastMovementQty: 4,
      lastMovementAt: new Date(),
      lastMovementBy: "Housing Supervisor",
      purchaseRequestNo: "HPR-SAMPLE-001",
      purchaseRequestStatus: "REQUESTED",
      qrCode: "QR:HSI-PPE-GLOVE",
    },
  });
  const housingAlertSettings = [
    ["UPCOMING_CHECKOUT", "Upcoming check-out", "Housing Supervisor,Reception Team", "SYSTEM,EMAIL"],
    ["OVERSTAY_OCCUPANT", "Overstay occupants", "Housing Supervisor,Camp Manager", "SYSTEM,EMAIL,SMS"],
    ["LOW_STOCK", "Low stock inventory", "Housing Inventory Manager,Housing Supervisor", "SYSTEM,EMAIL"],
    ["PENDING_APPROVAL", "Pending approvals", "Housing Coordinator,Housing Supervisor,Camp Manager,Reception Team", "SYSTEM,EMAIL"],
  ] as const;
  await Promise.all(
    housingAlertSettings.map(([alertType, label, roles, channels]) =>
      prisma.housingNotificationSetting.upsert({
        where: { alertType },
        update: {},
        create: { alertType, label, roles, channels, enabled: true, description: `${label} automatic alert`, severity: "MEDIUM" },
      }),
    ),
  );
  await prisma.housingHistory.createMany({
    data: [
      { entity: "room", entityId: housingRooms[0].id, roomId: housingRooms[0].id, action: "Room seeded", actor: "System", details: "Initial room occupancy loaded." },
      { entity: "booking", entityId: booking.id, bookingId: booking.id, roomId: housingRooms[0].id, action: "Booking checked in", actor: "Housing Supervisor", details: "Resident checked in and bed allocation confirmed." },
    ],
  });
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
