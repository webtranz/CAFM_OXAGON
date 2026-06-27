const section = {
  dashboard: "section.dashboard.dashboard.view",
  serviceRequests: "section.tickets.service.requests.view",
  workOrders: "section.tickets.work.orders.view",
  jobPlans: "section.tickets.job.plans.view",
  ppmPlanner: "section.tickets.ppm.planner.view",
  facilityReport: "section.facility.bookings.facility.report.view",
  locations: "section.facility.bookings.locations.view",
  bookingsReport: "section.facility.bookings.bookings.report.view",
  housingDashboard: "section.housing.operations.housing.dashboard.view",
  housingBookings: "section.housing.operations.accommodation.and.bookings.view",
  housingInspections: "section.housing.operations.room.inspections.view",
  housingAssets: "section.housing.operations.housing.assets.view",
  housingInventory: "section.housing.operations.housing.inventory.view",
  housingApprovals: "section.housing.operations.approvals.and.alerts.view",
  housingNotifications: "section.housing.operations.notification.settings.view",
  housingReports: "section.housing.operations.housing.reports.view",
  assets: "section.assets.management.assets.management.view",
  assetSites: "section.assets.management.sites.view",
  assetBuildings: "section.assets.management.buildings.view",
  assetSpaces: "section.assets.management.spaces.view",
  assetDepartments: "section.assets.management.departments.view",
  assetCategories: "section.assets.management.asset.categories.view",
  bulkAssets: "section.assets.management.bulk.upload.assets.view",
  assetAllocation: "section.assets.management.asset.inventory.allocation.view",
  inventory: "section.inventory.management.inventory.view",
  bulkInventory: "section.inventory.management.bulk.upload.inventory.view",
  inventoryReports: "section.inventory.management.inventory.reports.view",
  hse: "section.safety.hse.view",
  iot: "section.safety.iot.bms.view",
  complianceDashboard: "section.compliance.and.certification.compliance.dashboard.view",
  certificationRegister: "section.compliance.and.certification.certification.register.view",
  nonCompliance: "section.compliance.and.certification.non.compliance.management.view",
  auditCalendar: "section.compliance.and.certification.audit.calendar.view",
  expiryAlerts: "section.compliance.and.certification.expiry.alerts.view",
  omManuals: "section.document.management.operation.and.maintenance.manuals.view",
  warranties: "section.document.management.equipment.warranties.and.guarantees.view",
  contracts: "section.document.management.support.contracts.and.slas.view",
  incidents: "section.incident.and.case.management.incident.and.case.management.view",
  employees: "section.resource.management.employees.view",
  shiftRotation: "section.resource.management.shift.and.rotation.view",
  timeSheets: "section.resource.management.time.sheets.view",
  departmentCodes: "section.services.department.codes.view",
  teamCodes: "section.services.create.team.code.view",
  serviceTeams: "section.services.service.teams.view",
  servicesCatalog: "section.services.services.catalog.view",
  bulkServices: "section.services.bulk.upload.services.view",
  users: "section.users.management.users.management.view",
  rolesPermissions: "section.users.management.roles.and.permissions.view",
  bulkCenter: "section.utilities.bulk.upload.center.view",
  templates: "section.utilities.bulk.upload.templates.view",
  reports: "section.utilities.csv.excel.pdf.reports.view",
  auditLogs: "section.activity.logs.audit.logs.view",
  bulkProgress: "section.activity.logs.bulk.upload.progress.view",
  reportsPreview: "section.activity.logs.reports.preview.view",
};

const ticketViewer = [section.dashboard, section.serviceRequests, section.workOrders, "requests.view", "work.view"];
const ticketPlanner = [...ticketViewer, section.jobPlans, section.ppmPlanner, "work.manage", "ppm.manage"];
const assetViewer = [section.assets, section.assetSites, section.assetBuildings, section.assetSpaces, section.assetDepartments, section.assetCategories, section.assetAllocation, "assets.view"];
const reportsViewer = [section.facilityReport, section.bookingsReport, section.inventoryReports, section.reports, section.reportsPreview, "reports.view"];
const serviceSetup = [section.departmentCodes, section.teamCodes, section.serviceTeams, section.servicesCatalog, section.bulkServices, "users.manage"];
const housingViewer = [section.housingDashboard, section.housingBookings, section.housingInspections, section.housingAssets, section.housingInventory, section.housingApprovals, section.housingReports, "housing.view"];
const complianceViewer = [section.complianceDashboard, section.certificationRegister, section.nonCompliance, section.auditCalendar, section.expiryAlerts, "compliance.view"];
const documentsViewer = [section.omManuals, section.warranties, section.contracts];
const actionPermissions = [
  "assets.manage",
  "assets.view",
  "work.manage",
  "work.execute",
  "work.assign",
  "work.verify",
  "work.view",
  "requests.manage",
  "requests.approve",
  "requests.view",
  "ppm.manage",
  "documents.upload",
  "users.manage",
  "roles.manage",
  "reports.view",
  "reception.manage",
  "resident.portal",
  "housing.manage",
  "housing.approve",
  "housing.view",
  "compliance.manage",
  "compliance.view",
];

export const predefinedRolePermissions: Record<string, string[]> = {
  Admin: [...Object.values(section), ...actionPermissions],
  "Department Supervisor": [
    ...ticketPlanner,
    ...assetViewer,
    ...reportsViewer,
    ...serviceSetup,
    ...complianceViewer,
    ...documentsViewer,
    section.inventory,
    section.locations,
    section.incidents,
    section.employees,
    section.shiftRotation,
    section.timeSheets,
    "requests.manage",
    "requests.approve",
    "work.assign",
    "work.verify",
    "compliance.manage",
  ],
  Supervisor: [
    ...ticketPlanner,
    ...assetViewer,
    ...reportsViewer,
    section.inventory,
    section.locations,
    section.incidents,
    section.employees,
    section.timeSheets,
    "requests.manage",
    "requests.approve",
    "work.assign",
    "work.verify",
  ],
  Helpdesk: [
    ...ticketViewer,
    section.locations,
    section.departmentCodes,
    section.serviceTeams,
    section.servicesCatalog,
    section.reports,
    "requests.manage",
    "requests.approve",
    "reports.view",
  ],
  "Service Team": [
    ...ticketViewer,
    section.ppmPlanner,
    section.assetAllocation,
    section.inventory,
    section.timeSheets,
    "work.execute",
    "ppm.manage",
  ],
  Technician: [
    ...ticketViewer,
    section.ppmPlanner,
    section.assetAllocation,
    section.inventory,
    section.timeSheets,
    "work.execute",
    "ppm.manage",
  ],
  Reception: [
    section.dashboard,
    section.serviceRequests,
    section.housingBookings,
    section.housingDashboard,
    "requests.view",
    "requests.manage",
    "reception.manage",
    "housing.view",
  ],
  Resident: [section.dashboard, section.serviceRequests, "resident.portal"],
  Requester: [section.dashboard, section.serviceRequests, "requests.view"],
  "Read-only": [
    ...ticketViewer,
    ...assetViewer,
    ...reportsViewer,
    ...housingViewer,
    ...complianceViewer,
    ...documentsViewer,
    section.inventory,
    section.incidents,
  ],
};

function normalizeRole(role: string) {
  const lower = role.trim().toLowerCase();
  return Object.keys(predefinedRolePermissions).find((name) => name.toLowerCase() === lower);
}

export function predefinedPermissionsForRole(role: string) {
  const presetRole = normalizeRole(role);
  if (!presetRole) return [];
  return Array.from(new Set(predefinedRolePermissions[presetRole]));
}

export function isPredefinedRole(role: string) {
  return Boolean(normalizeRole(role));
}
