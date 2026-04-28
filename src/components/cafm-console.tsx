"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Gauge,
  HardHat,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPinned,
  PackagePlus,
  Plus,
  Upload,
  Users,
  RadioTower,
  Search,
  ShieldCheck,
  Smartphone,
  TicketCheck,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { assetHealth, chartData, moduleStats } from "@/lib/demo-data";

type ConsoleData = {
  live: boolean;
  sites: any[];
  assets: any[];
  requests: any[];
  workOrders: any[];
  inventory: any[];
  inspections: any[];
  alerts: any[];
  teams: any[];
  services: any[];
  categories: any[];
  ppms: any[];
  users: any[];
  permissions: any[];
  departments: any[];
  employees: any[];
  rolePermissions: any[];
  locations: any[];
  jobPlans: any[];
  roles: any[];
  auditLogs: any[];
};

type ActionPermissions = {
  manageRequests: boolean;
  approveRequests: boolean;
  manageWork: boolean;
  executeWork: boolean;
  verifyWork: boolean;
};

const moduleGroups = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [{ id: "command", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Tickets",
    icon: TicketCheck,
    items: [
      { id: "helpdesk", label: "Service Requests", icon: TicketCheck },
      { id: "work", label: "Work Orders", icon: Wrench },
      { id: "jobPlans", label: "Job Plans", icon: ClipboardCheck },
      { id: "ppm", label: "PPM Planner", icon: CalendarCheck },
    ],
  },
  {
    label: "Facility Bookings",
    icon: MapPinned,
    items: [
      { id: "command", label: "Facility Report", icon: Gauge, view: "facility-report" },
      { id: "locations", label: "Locations", icon: MapPinned, view: "locations" },
      { id: "reports", label: "Bookings Report", icon: ClipboardCheck, view: "bookings-report" },
    ],
  },
  {
    label: "Assets Management",
    icon: Building2,
    items: [
      { id: "assets", label: "Assets Management", icon: Building2, view: "assets-register" },
      { id: "bulk", label: "Bulk Upload Assets", icon: Upload, view: "bulk-assets" },
      { id: "assets", label: "Asset Inventory Allocation", icon: ClipboardCheck, view: "asset-allocation" },
    ],
  },
  {
    label: "Inventory Management",
    icon: Boxes,
    items: [
      { id: "inventory", label: "Inventory", icon: Boxes, view: "inventory-register" },
      { id: "bulk", label: "Bulk Upload Inventory", icon: Upload, view: "bulk-inventory" },
      { id: "reports", label: "Inventory Reports", icon: ClipboardCheck, view: "inventory-report" },
    ],
  },
  {
    label: "Safety",
    icon: ShieldCheck,
    items: [
      { id: "hse", label: "HSE", icon: ShieldCheck },
      { id: "iot", label: "IoT / BMS", icon: RadioTower },
    ],
  },
  {
    label: "Human Resources",
    icon: Users,
    items: [
              { id: "hr", label: "Employees", icon: Users },
              { id: "users", label: "Roles & Permissions", icon: ShieldCheck },
    ],
  },
  {
    label: "Services",
    icon: ClipboardCheck,
    items: [
      { id: "teams", label: "Department Codes", icon: MapPinned, view: "departments" },
      { id: "teams", label: "Create Team Code", icon: Users, view: "team-code" },
      { id: "teams", label: "Service Teams", icon: Users, view: "service-teams" },
      { id: "teams", label: "Services Catalog", icon: ClipboardCheck, view: "services-catalog" },
      { id: "bulk", label: "Bulk Upload Services", icon: Upload, view: "bulk-services" },
    ],
  },
  {
    label: "Users Management",
    icon: Users,
    items: [
      { id: "users", label: "Users Management", icon: Users, view: "users-management" },
      { id: "users", label: "Permissions", icon: ShieldCheck, view: "permissions" },
    ],
  },
  {
    label: "Utilities",
    icon: Upload,
    items: [
      { id: "bulk", label: "Bulk Upload Center", icon: Upload, view: "bulk-center" },
      { id: "templates", label: "Bulk Upload Templates", icon: ClipboardCheck, view: "templates" },
      { id: "reports", label: "CSV / Excel / PDF Reports", icon: ClipboardCheck, view: "reports-export" },
    ],
  },
  {
    label: "Activity Logs",
    icon: Activity,
    items: [
      { id: "audit", label: "Audit Logs", icon: Activity },
      { id: "reports", label: "Reports Preview", icon: ClipboardCheck },
    ],
  },
];

const healthColors = ["#35a852", "#0f8b8d", "#ffd166", "#f45d48"];
const PAGE_SIZE = 100;
const modulePermissions: Record<string, string> = {
  assets: "assets.manage",
  work: "work.execute",
  helpdesk: "requests.view",
  ppm: "ppm.manage",
  users: "users.manage",
  reports: "reports.view",
  bulk: "assets.manage",
  templates: "assets.manage",
  teams: "requests.manage",
  jobPlans: "work.manage",
  locations: "requests.manage",
  inventory: "assets.manage",
  hse: "reports.view",
  iot: "reports.view",
  hr: "users.manage",
  audit: "reports.view",
};
const statToneClasses: Record<string, string> = {
  coral: "text-coral",
  leaf: "text-leaf",
  lagoon: "text-lagoon",
  sun: "text-amber-600",
};

function cleanMessage(message: string) {
  return message
    .replaceAll("\n", " ")
    .replaceAll("{", "")
    .replaceAll("}", "")
    .replaceAll('"', "")
    .slice(0, 260);
}

function bulkModuleFromView(view: string) {
  const map: Record<string, string> = {
    "bulk-assets": "assets",
    "bulk-inventory": "inventory",
    "bulk-services": "services",
  };
  return map[view] ?? "assets";
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function minutesBetween(start?: unknown, end?: unknown) {
  if (!start || !end) return "-";
  const startTime = new Date(String(start)).getTime();
  const endTime = new Date(String(end)).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return "-";
  const minutes = Math.max(0, Math.round((endTime - startTime) / 60000));
  return `${minutes} min`;
}

function workTimingRows(work: any): [string, unknown][] {
  return [
    ["Response Time", work.responseAt],
    ["Resolution Time", work.resolutionAt],
    ["Finish Time", work.finishedAt],
    ["Response to Resolution", minutesBetween(work.responseAt, work.resolutionAt)],
    ["Resolution to Finish", minutesBetween(work.resolutionAt, work.finishedAt)],
    ["Total Response to Finish", minutesBetween(work.responseAt, work.finishedAt)],
  ];
}

function localWorkMetric(work: any) {
  return {
    response: minutesBetween(work.createdAt, work.responseAt),
    resolution: minutesBetween(work.responseAt, work.resolutionAt),
    finish: minutesBetween(work.resolutionAt, work.finishedAt),
    total: minutesBetween(work.responseAt, work.finishedAt),
  };
}

function workMetricRows(workOrders: any[], showOnlyDelayed: boolean) {
  return workOrders
    .map((work) => {
      const timing = localWorkMetric(work);
      const delayed = timing.response === "-" || timing.resolution === "-" || timing.finish === "-";
      return {
        ...work,
        assetTag: work.asset?.tag ?? work.assetTag ?? "",
        responseMetric: timing.response,
        resolutionMetric: timing.resolution,
        finishMetric: timing.finish,
        totalMetric: timing.total,
        delayed,
      };
    })
    .filter((work) => !showOnlyDelayed || work.delayed || work.status !== "CLOSED");
}

function DetailPanel({ title, rows }: { title: string; rows: [string, unknown][] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-base font-black text-ink">{title}</h4>
      <div className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[140px_1fr] gap-3 rounded-lg bg-slate-50 p-2 text-sm">
            <span className="font-black text-slate-500">{label}</span>
            <span className="min-w-0 break-words font-bold text-slate-800">{displayValue(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function dashboardSubtitle(role: string, department?: string | null) {
  const lower = role.toLowerCase();
  if (lower === "admin" || lower.includes("super admin")) {
    return "Admin dashboard: full visibility for service requests, work orders, PPM, users, roles, reports and analytics.";
  }
  if (lower.includes("supervisor")) {
    return `Supervisor dashboard: department-specific requests, work orders and PPM for ${department || "your department"}.`;
  }
  if (lower.includes("technician") || lower.includes("service team")) {
    return "Technician dashboard: assigned work orders, assigned requests and assigned PPM task execution.";
  }
  return "Requester dashboard: create and track your service requests.";
}

function roleKindLabel(role: string) {
  const lower = role.toLowerCase();
  if (lower === "admin" || lower.includes("super admin")) return "admin";
  if (lower.includes("supervisor")) return "supervisor";
  if (lower.includes("technician") || lower.includes("service team")) return "technician";
  return "requester";
}

export function CafmConsole({ data, user }: { data: ConsoleData; user: { id?: string; name: string; email: string; role: string; department?: string | null; team?: { code: string; name?: string } | null } }) {
  const [records, setRecords] = useState(data);
  const [active, setActive] = useState("command");
  const [activeView, setActiveView] = useState("dashboard");
  const [activeMenuKey, setActiveMenuKey] = useState("Dashboard-Dashboard");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [health, setHealth] = useState<{ app: string; database: string; message?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const filteredAssets = useMemo(() => {
    return records.assets.filter((asset) => `${asset.tag} ${asset.name} ${asset.category}`.toLowerCase().includes(query.toLowerCase()));
  }, [records.assets, query]);
  const permissionCodes = useMemo(() => {
    return new Set(records.rolePermissions.filter((item) => item.role === user.role).map((item) => item.permission.code));
  }, [records.rolePermissions, user.role]);
  const can = (permission?: string) => user.role === "Admin" || !permission || permissionCodes.has(permission);
  const canOpenModule = (moduleId: string) => can(modulePermissions[moduleId]);
  const canViewActive = canOpenModule(active);
  const actionPermissions = {
    manageRequests: can("requests.manage"),
    approveRequests: can("requests.approve"),
    manageWork: can("work.manage"),
    executeWork: can("work.execute"),
    verifyWork: can("work.verify"),
  };

  function navigate(moduleId: string, menuKey: string, view = moduleId) {
    if (!canOpenModule(moduleId)) {
      setToast("You do not have permission to access this module.");
      return;
    }
    setActive(moduleId);
    setActiveView(view);
    setActiveMenuKey(menuKey);
  }

  async function checkHealth() {
    const response = await fetch("/api/health", { cache: "no-store" });
    const result = await response.json();
    setHealth(result);
  }

  async function refreshData() {
    const response = await fetch("/api/operating-data", { cache: "no-store" });
    if (response.ok) {
      setRecords(await response.json());
    }
    await checkHealth();
  }

  async function submitRequest(formData: FormData) {
    setSaving(true);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setToast(response.ok ? `Service request ${result.ticketNo} created and saved.` : cleanMessage(result.message ?? "Service request failed."));
    if (response.ok) await refreshData();
    setSaving(false);
  }

  async function submitWorkOrder(formData: FormData) {
    setSaving(true);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setToast(response.ok ? `Work order ${result.woNo} created and saved.` : cleanMessage(result.message ?? "Work order failed."));
    if (response.ok) await refreshData();
    setSaving(false);
  }

  async function postRecord(path: string, formData: FormData, successLabel: string) {
    setSaving(true);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setToast(response.ok ? `${successLabel} saved.` : cleanMessage(result.message ?? "Action failed."));
    if (response.ok) await refreshData();
    setSaving(false);
  }

  async function bulkUpload(formData: FormData) {
    setSaving(true);
    const response = await fetch("/api/bulk-upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    setToast(cleanMessage(result.message ?? (response.ok ? "Bulk upload complete." : "Bulk upload failed.")));
    await refreshData();
    setSaving(false);
  }

  async function patchRecord(path: string, body: Record<string, unknown>, successLabel: string) {
    setSaving(true);
    const response = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setToast(response.ok ? successLabel : cleanMessage(result.message ?? "Action failed."));
    if (response.ok) await refreshData();
    setSaving(false);
  }

  async function updateAsset(id: string, formData: FormData) {
    await patchRecord(`/api/assets/${id}`, Object.fromEntries(formData.entries()) as Record<string, string>, "Asset updated by admin.");
  }

  async function deleteRecord(path: string, successLabel: string) {
    setSaving(true);
    const response = await fetch(path, { method: "DELETE" });
    const result = await response.json();
    setToast(response.ok ? successLabel : cleanMessage(result.message ?? "Delete failed."));
    if (response.ok) await refreshData();
    setSaving(false);
  }

  async function convertRequestToWorkOrder(id: string, assignment: { assignedTeamCode?: string; assignedToEmail?: string } = {}) {
    setSaving(true);
    const response = await fetch(`/api/service-requests/${id}/convert-work-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignment),
    });
    const result = await response.json();
    setToast(response.ok ? `Work order ${result.woNo} created from request.` : cleanMessage(result.message ?? "Conversion failed."));
    if (response.ok) await refreshData();
    setSaving(false);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen text-ink">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3 px-1">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-lg border border-amber-200 bg-white p-1 shadow-sm">
              <Image src="/tafga.png" alt="Tamimi Global CAFM logo" width={52} height={52} className="h-full w-full object-contain" priority />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight">Tamimi Global CAFM</h1>
              <p className="text-xs text-slate-500">Enterprise facility command</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-bold text-emerald-700">
              <Activity size={16} />
              {health?.database === "connected" || records.live ? "Database online" : "Database issue"}
            </div>
            <p className="mt-1 text-emerald-900/70">
              {health ? `Status: ${health.database}` : "Checking database..."}
            </p>
            {health?.message && <p className="mt-1 break-words text-xs text-coral">{health.message}</p>}
            <button onClick={checkHealth} className="mt-3 h-9 rounded-lg bg-white px-3 text-xs font-black text-lagoon shadow-sm">
              Check DB
            </button>
          </div>

          <nav className="mt-5 grid gap-1">
            {moduleGroups.map((group) => {
              const visibleItems = group.items.filter((item) => canOpenModule(item.id));
              if (!visibleItems.length) return null;

              return (
                <details key={group.label} open={visibleItems.some((item) => `${group.label}-${item.label}` === activeMenuKey)} className="group">
                  <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                    <span className="flex items-center gap-3">
                      <group.icon size={18} className="text-slate-600" />
                      {group.label}
                    </span>
                    <ChevronDown size={15} className="text-slate-400 transition group-open:rotate-180" />
                  </summary>
                  <div className="ml-4 mt-1 grid border-l border-slate-100 pl-3">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const menuKey = `${group.label}-${item.label}`;
                      return (
                        <button
                          key={menuKey}
                          onClick={() => navigate(item.id, menuKey, String("view" in item ? item.view : item.id))}
                          className={`flex h-9 items-center gap-2 rounded-lg px-2 text-left text-sm transition ${
                            activeMenuKey === menuKey ? "bg-indigo-50 font-black text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                          }`}
                        >
                          <Icon size={13} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </nav>

          <div className="mt-5 rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-black">{user.name}</p>
            <p className="mt-1 text-xs text-slate-700">{user.role} / {user.department || "All departments"} / {user.email}</p>
            <button onClick={logout} className="mt-3 flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-black text-coral shadow-sm">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </aside>

        <section className="space-y-5 p-4 sm:p-6 lg:p-8">
          <header className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 p-5 text-white shadow-lift">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-white/80">International level CAFM suite</p>
                <h2 className="mt-1 text-3xl font-black sm:text-4xl">One-stop facility operations system</h2>
                <p className="mt-2 max-w-3xl text-white/80">
                  {dashboardSubtitle(user.role, user.department)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate("work", "Tickets-Work Orders")} className="flex h-11 items-center gap-2 rounded-lg bg-coral px-4 font-black text-white shadow-lg">
                  <Plus size={18} />
                  New Work
                </button>
                <button onClick={() => navigate("helpdesk", "Tickets-Service Requests")} className="flex h-11 items-center gap-2 rounded-lg bg-lagoon px-4 font-black text-white shadow-lg">
                  <Smartphone size={18} />
                  Dispatch
                </button>
              </div>
            </div>
          </header>

          {toast && <div className="rounded-lg border border-lagoon/20 bg-white p-3 font-bold text-lagoon shadow-lift">{toast}</div>}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {moduleStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/80 bg-white p-4 shadow-lift">
                <p className="text-sm font-bold text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-black">{stat.value}</p>
                <p className={`mt-1 text-sm font-bold ${statToneClasses[stat.tone]}`}>{stat.delta}</p>
              </div>
            ))}
          </section>

          {!canViewActive && <AccessDenied moduleId={active} />}
          {canViewActive && active === "command" && <CommandCenter data={records} />}
          {canViewActive && active === "assets" && (
            <Assets
              assets={filteredAssets}
              selectedAssetId={selectedAssetId}
              setSelectedAssetId={setSelectedAssetId}
              query={query}
              setQuery={setQuery}
              saving={saving}
              submitAsset={(formData) => postRecord("/api/assets", formData, "Asset")}
              updateAsset={updateAsset}
            />
          )}
          {canViewActive && active === "work" && (
            <WorkOrders
              data={records}
              submitWorkOrder={submitWorkOrder}
              saving={saving}
              permissions={actionPermissions}
              role={user.role}
              updateWorkOrder={(id, formData) => patchRecord(`/api/work-orders/${id}`, Object.fromEntries(formData.entries()) as Record<string, string>, "Work order updated by admin.")}
              updateWorkStatus={(id, status) => patchRecord(`/api/work-orders/${id}`, { status }, `Work order marked ${status}.`)}
              deleteWorkOrder={(id) => deleteRecord(`/api/work-orders/${id}`, "Work order deleted.")}
            />
          )}
          {canViewActive && active === "helpdesk" && (
            <Helpdesk
              requests={records.requests}
              services={records.services}
              departments={records.departments}
              teams={records.teams}
              locations={records.locations}
              submitRequest={submitRequest}
              permissions={actionPermissions}
              role={user.role}
              updateRequest={(id, formData) => patchRecord(`/api/service-requests/${id}`, Object.fromEntries(formData.entries()) as Record<string, string>, "Service request updated by admin.")}
              deleteRequest={(id) => deleteRecord(`/api/service-requests/${id}`, "Service request deleted.")}
              convertRequest={convertRequestToWorkOrder}
              saving={saving}
            />
          )}
          {canViewActive && active === "jobPlans" && <JobPlans jobPlans={records.jobPlans} services={records.services} departments={records.departments} saving={saving} submitJobPlan={(formData) => postRecord("/api/job-plans", formData, "Job plan")} />}
          {canViewActive && active === "locations" && <Locations locations={records.locations} saving={saving} submitLocation={(formData) => postRecord("/api/locations", formData, "Location")} />}
          {canViewActive && active === "ppm" && <Ppm ppms={records.ppms} assets={records.assets} workOrders={records.workOrders} saving={saving} submitPpm={(formData) => postRecord("/api/ppm", formData, "PPM")} updatePpm={(body) => patchRecord("/api/ppm", body, "PPM updated.")} />}
          {canViewActive && active === "inventory" && <Inventory inventory={records.inventory} saving={saving} submitInventory={(formData) => postRecord("/api/inventory", formData, "Inventory item")} />}
          {canViewActive && active === "hse" && <Hse inspections={records.inspections} saving={saving} submitInspection={(formData) => postRecord("/api/inspections", formData, "Inspection")} />}
          {canViewActive && active === "iot" && <Iot alerts={records.alerts} saving={saving} acknowledgeAlert={(id) => patchRecord(`/api/iot-alerts/${id}`, {}, "IoT alert acknowledged.")} />}
          {canViewActive && active === "teams" && (
            <TeamsServices
              teams={records.teams}
              services={records.services}
              categories={records.categories}
              departments={records.departments}
              saving={saving}
              submitTeam={(formData) => postRecord("/api/teams", formData, "Team")}
              submitService={(formData) => postRecord("/api/services", formData, "Service")}
              submitCategory={(formData) => postRecord("/api/asset-categories", formData, "Asset category")}
              submitDepartment={(formData) => postRecord("/api/departments", formData, "Department")}
              view={activeView}
            />
          )}
          {canViewActive && active === "bulk" && <BulkUpload saving={saving} onSubmit={bulkUpload} initialModule={bulkModuleFromView(activeView)} />}
          {canViewActive && active === "templates" && <Templates />}
          {canViewActive && active === "users" && (
            <UsersRoles
              users={records.users}
              teams={records.teams}
              departments={records.departments}
              roles={records.roles}
              permissions={records.permissions}
              rolePermissions={records.rolePermissions}
              saving={saving}
              submitUser={(formData) => postRecord("/api/users", formData, "User")}
              submitRole={(formData) => postRecord("/api/roles", formData, "Custom role")}
              updateUser={(id, formData) => patchRecord(`/api/users/${id}`, Object.fromEntries(formData.entries()) as Record<string, string>, "User updated.")}
              deleteUser={(id) => deleteRecord(`/api/users/${id}`, "User deleted.")}
              refreshData={refreshData}
              setToast={(message) => setToast(cleanMessage(message))}
              saveRolePermissions={async (role, permissionCodes) => {
                setSaving(true);
                const response = await fetch("/api/role-permissions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ role, permissionCodes }),
                });
                const result = await response.json();
                setToast(response.ok ? "Role permissions updated." : cleanMessage(result.message ?? "Permission update failed."));
                await refreshData();
                setSaving(false);
              }}
            />
          )}
          {canViewActive && active === "reports" && <Reports />}
          {canViewActive && active === "audit" && <AuditLogs logs={records.auditLogs ?? []} />}
          {canViewActive && active === "hr" && <HumanResources employees={records.employees} departments={records.departments} saving={saving} submitEmployee={(formData) => postRecord("/api/employees", formData, "Employee")} />}
        </section>
      </section>
    </main>
  );
}

function CommandCenter({ data }: { data: ConsoleData }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
      <Panel title="Operational Throughput" icon={Gauge}>
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ppm" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0f8b8d" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#0f8b8d" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e6ee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="ppm" stroke="#0f8b8d" fill="url(#ppm)" strokeWidth={3} />
              <Area type="monotone" dataKey="reactive" stroke="#f45d48" fill="#f45d4822" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Asset Health" icon={Activity}>
        <div className="h-80">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={assetHealth} dataKey="value" innerRadius={65} outerRadius={105} paddingAngle={5}>
                {assetHealth.map((entry, index) => (
                  <Cell key={entry.name} fill={healthColors[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {assetHealth.map((item, index) => (
            <div key={item.name} className="rounded-lg bg-slate-50 p-2 text-sm font-bold">
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: healthColors[index] }} />
              {item.name}: {item.value}%
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Priority Work Queue" icon={HardHat}>
        <DataTable
          rows={data.workOrders}
          columns={[
            ["woNo", "WO"],
            ["title", "Job"],
            ["priority", "Priority"],
            ["status", "Status"],
            ["dueAt", "Due"],
          ]}
        />
      </Panel>
      <Panel title="Portfolio Sites" icon={MapPinned}>
        <DataTable
          rows={data.sites}
          columns={[
            ["name", "Site"],
            ["city", "City"],
            ["type", "Type"],
            ["areaSqm", "Area sqm"],
          ]}
        />
      </Panel>
    </section>
  );
}

function AccessDenied({ moduleId }: { moduleId: string }) {
  return (
    <Panel title="Access Restricted" icon={ShieldCheck}>
      <p className="text-sm font-bold text-slate-600">
        Your role does not have permission for {moduleId}. Update this role in Users Management / Permissions to allow access.
      </p>
    </Panel>
  );
}

function ReportButtons({ type, label = "Report" }: { type: string; label?: string }) {
  const href = (format: string) => `/api/reports?type=${encodeURIComponent(type)}&format=${format}`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <span className="rounded-lg bg-white px-3 py-2 text-xs font-black uppercase text-slate-500 shadow-sm">{label}</span>
      <a className="rounded-lg bg-white px-3 py-2 text-xs font-black text-ink shadow-sm hover:text-lagoon" href={href("html")} target="_blank" rel="noreferrer">Preview</a>
      <a className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white shadow-sm" href={href("csv")}>CSV</a>
      <a className="rounded-lg bg-leaf px-3 py-2 text-xs font-black text-white shadow-sm" href={href("excel")}>Excel</a>
      <a className="rounded-lg bg-coral px-3 py-2 text-xs font-black text-white shadow-sm" href={href("pdf")}>PDF</a>
    </div>
  );
}

function Assets({
  assets,
  selectedAssetId,
  setSelectedAssetId,
  query,
  setQuery,
  submitAsset,
  updateAsset,
  saving,
}: {
  assets: any[];
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string) => void;
  query: string;
  setQuery: (value: string) => void;
  submitAsset: (formData: FormData) => void;
  updateAsset: (id: string, formData: FormData) => void;
  saving: boolean;
}) {
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(assets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleAssets = assets.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, assets.length]);

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Panel title="Enterprise Asset Register" icon={Building2}>
        <ReportButtons type="assets" label="Assets report" />
        <div className="mb-4 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tag, asset, category or system" className="w-full outline-none" />
        </div>
      <div className="grid gap-3">
          <div className="rounded-lg bg-lagoon/5 p-3 text-sm font-black text-lagoon">
            Showing {visibleAssets.length} of {assets.length} uploaded / registered assets
          </div>
          {visibleAssets.map((asset, index) => (
            <button
              key={asset.id}
              onClick={() => setSelectedAssetId(asset.id)}
              className={`grid gap-2 rounded-lg border p-4 text-left transition ${selectedAsset?.id === asset.id ? "border-lagoon bg-lagoon/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-slate-100 px-2 text-xs font-black text-slate-600">
                    {startIndex + index + 1}
                  </span>
                  <div>
                  <p className="font-black">{asset.tag} | {asset.assetDescription ?? asset.name}</p>
                  <p className="text-sm text-slate-500">{asset.assetGroup ?? asset.category} / {asset.system}</p>
                  </div>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black">{asset.status}</span>
              </div>
              <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                <span>Site: {asset.siteCode ?? "-"}</span>
                <span>Zone: {asset.zone ?? "-"}</span>
                <span>BLDG: {asset.buildingCode ?? asset.building?.name ?? "-"}</span>
                <span>Floor: {asset.floor ?? "-"}</span>
                <span>Room: {asset.room ?? "-"}</span>
                <span>Dept: {asset.departmentCode ?? "-"}</span>
                <span>Parent: {asset.parentAsset ?? "-"}</span>
                <span>Health: {asset.conditionScore}%</span>
              </div>
            </button>
          ))}
          <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={assets.length} />
        </div>
      </Panel>
      <div className="space-y-5">
        {selectedAsset && <AssetIdentity asset={selectedAsset} />}
        {selectedAsset && <AssetHistoryPanel asset={selectedAsset} />}
        <AssetCreateForm onSubmit={submitAsset} saving={saving} />
        {selectedAsset && (
          <AssetEditForm asset={selectedAsset} saving={saving} onSubmit={(formData) => updateAsset(selectedAsset.id, formData)} />
        )}
      </div>
    </section>
  );
}

function AssetCreateForm({ onSubmit, saving }: { onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const assetNumber = String(formData.get("tag") ?? "").trim();
    const assetDescription = String(formData.get("assetDescription") ?? "").trim();
    const assetGroup = String(formData.get("assetGroup") ?? "").trim();

    formData.set("name", assetDescription || assetNumber);
    formData.set("category", assetGroup || "HVAC");
    formData.set("system", assetDescription || assetGroup || "HVAC");
    formData.set("criticality", "MEDIUM");
    formData.set("conditionScore", "85");

    await onSubmit(formData);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sun/50 text-amber-700">
          <PackagePlus size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black">Register Asset</h3>
          <p className="text-sm font-bold text-slate-500">HVAC Asset Register template fields</p>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <AssetTextField label="SITE" name="siteCode" />
          <AssetTextField label="ZONE" name="zone" />
          <AssetTextField label="BLDG" name="buildingCode" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AssetTextField label="FLOOR" name="floor" />
          <AssetTextField label="ROOM" name="room" />
        </div>
        <AssetTextField label="Asset Group" name="assetGroup" />
        <AssetTextField label="ASSET NUMBER" name="tag" />
        <AssetTextField label="Asset Description" name="assetDescription" />
        <AssetTextField label="Additional description" name="additionalDescription" />
        <AssetTextField label="Parent Asset" name="parentAsset" />
        <AssetTextField label="Department" name="departmentCode" />
        <ImageUploadField name="documentationUrl" />
        <label className="grid gap-1 text-sm font-bold text-slate-600">
          Remarks
          <textarea name="remarks" className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        </label>
        <button disabled={saving} className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400">
          <Plus size={18} />
          {saving ? "Saving..." : "Save Asset"}
        </button>
      </div>
    </form>
  );
}

function AssetTextField({ label, name, required = false, defaultValue = "", type = "text" }: { label: string; name: string; required?: boolean; defaultValue?: string; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-600">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon"
      />
    </label>
  );
}

function AssetHistoryPanel({ asset }: { asset: any }) {
  return (
    <Panel title="Asset History" icon={CalendarCheck}>
      <div className="grid gap-2">
        {(asset.history ?? []).length === 0 && <p className="text-sm text-slate-500">No history recorded yet.</p>}
        {(asset.history ?? []).map((event: any) => (
          <div key={event.id} className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black">{event.title}</p>
              <span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{event.details}</p>
            <p className="mt-1 text-xs font-bold text-lagoon">{event.eventType} / {event.actor}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AssetIdentity({ asset }: { asset: any }) {
  const bars = String(asset.tag)
    .split("")
    .slice(0, 22)
    .map((char: string, index: number) => ((char.charCodeAt(0) + index) % 4) + 1);
  const purchase = Number(asset.purchaseCost ?? 0);
  const salvage = Number(asset.salvageValue ?? 0);
  const annualRate = Number(asset.depreciationRate ?? 0) / 100;
  const ageYears = Math.max(0, (Date.now() - new Date(asset.installDate ?? Date.now()).getTime()) / (365 * 24 * 60 * 60 * 1000));
  const bookValue = Math.max(salvage, purchase - purchase * annualRate * ageYears);

  return (
    <Panel title="Asset Identification" icon={ClipboardCheck}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase text-slate-500">QR / Barcode Payload</p>
        <p className="mt-1 break-words font-black text-lagoon">{asset.qrCode ?? `CAFM-ASSET:${asset.tag}`}</p>
        <div className="mt-4 flex h-20 items-end gap-1 rounded-lg bg-white p-3">
          {bars.map((width, index) => (
            <span key={`${asset.tag}-${index}`} className="h-full bg-ink" style={{ width }} />
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          <span>Serial: {asset.serialNumber ?? "-"}</span>
          <span>Site / Zone / Building: {asset.siteCode ?? "-"} / {asset.zone ?? "-"} / {asset.buildingCode ?? "-"}</span>
          <span>Asset group: {asset.assetGroup ?? "-"}</span>
          <span>Description: {asset.assetDescription ?? asset.name ?? "-"}</span>
          <span>Additional description: {asset.additionalDescription ?? "-"}</span>
          <span>Parent asset: {asset.parentAsset ?? "-"}</span>
          <span>Department: {asset.departmentCode ?? "-"}</span>
          <span>Floor / Room: {asset.floor ?? "-"} / {asset.room ?? "-"}</span>
          <span>Remarks: {asset.remarks ?? "-"}</span>
          <span>Warranty: {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "-"}</span>
          <span>Contract: {asset.contractRef ?? "-"}</span>
          <span>Book value: ${bookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </Panel>
  );
}

function AssetEditForm({ asset, saving, onSubmit }: { asset: any; saving: boolean; onSubmit: (formData: FormData) => void }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
  }

  const fieldClass = "h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon";
  const textValue = (value: unknown) => (value === null || value === undefined ? "" : String(value));
  const dateValue = (value: unknown) => (value ? new Date(String(value)).toISOString().slice(0, 10) : "");

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">Admin Edit Asset</h3>
      <p className="mt-1 text-sm font-bold text-slate-500">Same structure as the HVAC asset register template.</p>
      <div className="mt-4 grid gap-4">
        <div>
          <p className="mb-3 text-xs font-black uppercase text-lagoon">HVAC Asset Register Fields</p>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <EditField label="SITE" name="siteCode" defaultValue={textValue(asset.siteCode)} />
              <EditField label="ZONE" name="zone" defaultValue={textValue(asset.zone)} />
              <EditField label="BLDG" name="buildingCode" defaultValue={textValue(asset.buildingCode)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <EditField label="FLOOR" name="floor" defaultValue={textValue(asset.floor)} />
              <EditField label="ROOM" name="room" defaultValue={textValue(asset.room)} />
            </div>
            <EditField label="Asset Group" name="assetGroup" defaultValue={textValue(asset.assetGroup)} />
            <EditField label="ASSET NUMBER" name="tag" defaultValue={textValue(asset.tag)} />
            <EditField label="Asset Description" name="assetDescription" defaultValue={textValue(asset.assetDescription)} />
            <EditField label="Additional description" name="additionalDescription" defaultValue={textValue(asset.additionalDescription)} />
            <EditField label="Parent Asset" name="parentAsset" defaultValue={textValue(asset.parentAsset)} />
            <EditField label="Department" name="departmentCode" defaultValue={textValue(asset.departmentCode)} />
            <label className="grid gap-1 text-sm font-bold text-slate-600">
              Remarks
              <textarea name="remarks" defaultValue={textValue(asset.remarks)} className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            </label>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-black uppercase text-lagoon">Additional CAFM Fields</p>
          <div className="grid gap-3">
            <EditField label="System display name" name="name" defaultValue={textValue(asset.name)} />
            <EditField label="Category" name="category" defaultValue={textValue(asset.category)} />
            <EditField label="System" name="system" defaultValue={textValue(asset.system)} />
            <label className="grid gap-1 text-sm font-bold text-slate-600">
              Criticality
              <select name="criticality" defaultValue={asset.criticality} className={fieldClass}>
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-slate-600">
              Status
              <select name="status" defaultValue={asset.status} className={fieldClass}>
                <option>ACTIVE</option>
                <option>STANDBY</option>
                <option>DOWN</option>
                <option>RETIRED</option>
              </select>
            </label>
            <EditField label="Serial number" name="serialNumber" defaultValue={textValue(asset.serialNumber)} />
            <EditField label="Manufacturer" name="manufacturer" defaultValue={textValue(asset.manufacturer)} />
            <EditField label="Model" name="model" defaultValue={textValue(asset.model)} />
            <EditField label="Warranty expiry" name="warrantyExpiry" type="date" defaultValue={dateValue(asset.warrantyExpiry)} />
            <EditField label="Contract reference" name="contractRef" defaultValue={textValue(asset.contractRef)} />
            <ImageUploadField name="documentationUrl" defaultValue={textValue(asset.documentationUrl)} />
            <div className="grid grid-cols-3 gap-3">
              <EditField label="Cost" name="purchaseCost" type="number" defaultValue={textValue(asset.purchaseCost)} />
              <EditField label="Salvage" name="salvageValue" type="number" defaultValue={textValue(asset.salvageValue)} />
              <EditField label="Dep. %" name="depreciationRate" type="number" defaultValue={textValue(asset.depreciationRate)} />
            </div>
            <EditField label="Condition score" name="conditionScore" type="number" defaultValue={textValue(asset.conditionScore)} />
          </div>
        </div>
        <button disabled={saving} className="h-11 rounded-lg bg-coral font-black text-white disabled:bg-slate-400">Save Admin Changes</button>
      </div>
    </form>
  );
}

function EditField({ label, name, defaultValue, required = false, type = "text" }: { label: string; name: string; defaultValue: string; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-600">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        min={type === "number" && name === "conditionScore" ? 0 : undefined}
        max={type === "number" && name === "conditionScore" ? 100 : undefined}
        defaultValue={defaultValue}
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon"
      />
    </label>
  );
}

function WorkOrders({
  data,
  submitWorkOrder,
  saving,
  permissions,
  role,
  updateWorkOrder,
  updateWorkStatus,
  deleteWorkOrder,
}: {
  data: ConsoleData;
  submitWorkOrder: (formData: FormData) => void;
  saving: boolean;
  permissions: ActionPermissions;
  role: string;
  updateWorkOrder: (id: string, formData: FormData) => Promise<void> | void;
  updateWorkStatus: (id: string, status: string) => Promise<void> | void;
  deleteWorkOrder: (id: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewWork, setPreviewWork] = useState<any | null>(null);
  const [reviewWork, setReviewWork] = useState<{ work: any; action: "close" | "reopen" } | null>(null);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(data.workOrders[0]?.id ?? null);
  const [workAction, setWorkAction] = useState<string | null>(null);
  const [showTimeMetrics, setShowTimeMetrics] = useState(false);
  const [showOnlyDelayed, setShowOnlyDelayed] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const isTechnician = roleKindLabel(role) === "technician";
  const canAssignOrEdit = permissions.manageWork && !isTechnician;
  const canExecute = permissions.executeWork;
  const canFinalReview = permissions.verifyWork && !isTechnician;
  const statuses = ["All", ...Array.from(new Set(data.workOrders.map((work) => work.status).filter(Boolean)))];
  const categories = ["All", ...Array.from(new Set(data.workOrders.map((work) => work.departmentCode || work.assetType).filter(Boolean)))];
  const types = ["All", ...Array.from(new Set(data.workOrders.map((work) => work.type).filter(Boolean)))];
  const teams = ["All", ...Array.from(new Set(data.workOrders.map((work) => work.assignedTeamCode).filter(Boolean)))];
  const filteredWorks = useMemo(() => {
    const sourceRows = showTimeMetrics ? workMetricRows(data.workOrders, showOnlyDelayed) : data.workOrders;
    return sourceRows.filter((work) => {
      const haystack = `${work.woNo} ${work.title} ${work.type} ${work.assetType} ${work.departmentCode} ${work.serviceCode} ${work.assignedTeamCode} ${work.location} ${work.jobPlan}`.toLowerCase();
      const queryMatch = !search || haystack.includes(search.toLowerCase());
      const statusMatch = statusFilter === "All" || work.status === statusFilter;
      const priorityMatch = priorityFilter === "All" || work.priority === priorityFilter;
      const categoryMatch = categoryFilter === "All" || work.departmentCode === categoryFilter || work.assetType === categoryFilter;
      const typeMatch = typeFilter === "All" || work.type === typeFilter;
      const assignedMatch = assignedFilter === "All" || work.assignedTeamCode === assignedFilter || (assignedFilter === "Not Assigned" && !work.assignedTeamCode);
      const dueTime = work.dueAt ? new Date(work.dueAt).getTime() : null;
      const overdueMatch = !overdueOnly || (dueTime !== null && dueTime <= Date.now() + 24 * 60 * 60 * 1000 && work.status !== "CLOSED");
      return queryMatch && statusMatch && priorityMatch && categoryMatch && typeMatch && assignedMatch && overdueMatch;
    });
  }, [data.workOrders, search, statusFilter, priorityFilter, categoryFilter, typeFilter, assignedFilter, overdueOnly, showTimeMetrics, showOnlyDelayed]);
  const selectedWork = filteredWorks.find((work) => work.id === selectedWorkId) ?? filteredWorks[0] ?? data.workOrders[0];
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleWorks = filteredWorks.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    if (filteredWorks.length && !filteredWorks.some((work) => work.id === selectedWorkId)) {
      setSelectedWorkId(filteredWorks[0].id);
    }
  }, [filteredWorks, selectedWorkId]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, categoryFilter, typeFilter, assignedFilter, overdueOnly, showTimeMetrics, showOnlyDelayed, filteredWorks.length]);

  async function runWorkAction(key: string, work: any, action: () => Promise<void> | void) {
    setSelectedWorkId(work.id);
    setWorkAction(key);
    try {
      await action();
    } finally {
      setWorkAction(null);
    }
  }

  async function quickPatchWork(work: any, body: Record<string, string>) {
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => formData.append(key, value));
    await updateWorkOrder(work.id, formData);
    setPreviewWork((current: any) => current?.id === work.id ? { ...current, ...body } : current);
  }

  return (
    <section className="space-y-5">
      <Panel title="Work Orders" icon={Wrench}>
        <ReportButtons type="work-orders" label="Work orders report" />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setView("list")} className={`h-10 rounded-lg px-4 text-sm font-black ${view === "list" ? "bg-lagoon text-white" : "bg-slate-50 text-slate-600"}`}>List</button>
            <button type="button" onClick={() => setView("calendar")} className={`h-10 rounded-lg px-4 text-sm font-black ${view === "calendar" ? "bg-lagoon text-white" : "bg-slate-50 text-slate-600"}`}>Calendar</button>
          </div>
          <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 lg:max-w-md">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Work Orders" className="h-11 w-full text-sm outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowTimeMetrics((current) => !current)} className={`h-10 rounded-lg px-3 text-sm font-black ${showTimeMetrics ? "bg-lagoon text-white" : "bg-slate-50 text-lagoon"}`}>KPIs</button>
            {canAssignOrEdit && <button type="button" onClick={() => { setEditing(null); setCreateOpen(true); }} className="flex h-10 items-center gap-2 rounded-lg bg-lagoon px-4 text-sm font-black text-white"><Plus size={16} /> Work Order</button>}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3">
            {statuses.map((status) => <option key={status} value={status}>{status === "All" ? "Status" : status}</option>)}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3">
            <option value="All">Priority</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3">
            {categories.map((category) => <option key={category} value={category}>{category === "All" ? "Category" : category}</option>)}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3">
            {types.map((type) => <option key={type} value={type}>{type === "All" ? "Work Type" : type}</option>)}
          </select>
          <select value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3">
            <option value="All">Assigned to</option>
            <option value="Not Assigned">Not Assigned</option>
            {teams.filter((team) => team !== "All").map((team) => <option key={team} value={team}>{team}</option>)}
          </select>
          <button type="button" onClick={() => setAssignedFilter("Not Assigned")} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-lagoon">Not Assigned</button>
          <button type="button" onClick={() => setOverdueOnly((current) => !current)} className={`h-10 rounded-lg px-3 ${overdueOnly ? "bg-coral text-white" : "border border-slate-200 bg-white text-lagoon"}`}>Overdue & Due Today</button>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showTimeMetrics} onChange={(event) => setShowTimeMetrics(event.target.checked)} /> Show Time Metrics</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showOnlyDelayed} onChange={(event) => setShowOnlyDelayed(event.target.checked)} /> Show Only Delayed</label>
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("All"); setPriorityFilter("All"); setCategoryFilter("All"); setTypeFilter("All"); setAssignedFilter("All"); setOverdueOnly(false); }} className="ml-auto h-10 rounded-lg bg-white px-3 text-lagoon">Clear all</button>
        </div>
        {view === "list" ? (
          <>
            <div className="overflow-auto rounded-lg border border-slate-200 scrollbar-thin">
              <table className="min-w-[1700px] border-collapse bg-white text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-black">#</th>
                    <th className="px-3 py-3 font-black">Title</th>
                    <th className="px-3 py-3 font-black">Status</th>
                    <th className="px-3 py-3 font-black">Priority</th>
                    <th className="px-3 py-3 font-black">Category</th>
                    <th className="px-3 py-3 font-black">Due Date</th>
                    <th className="px-3 py-3 font-black">Asset</th>
                    <th className="px-3 py-3 font-black">Location</th>
                    <th className="px-3 py-3 font-black">Work Type</th>
                    <th className="px-3 py-3 font-black">Description</th>
                    <th className="px-3 py-3 font-black">Created when</th>
                    <th className="px-3 py-3 font-black">Assigned To</th>
                    <th className="px-3 py-3 font-black">Updated when</th>
                    <th className="px-3 py-3 font-black">Schedule</th>
                    <th className="px-3 py-3 font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleWorks.map((work, index) => (
                    <tr key={work.id} onClick={() => { setSelectedWorkId(work.id); setPreviewWork(work); }} className={`cursor-pointer border-t border-slate-100 align-top ${selectedWork?.id === work.id ? "bg-lagoon/5" : "hover:bg-slate-50"}`}>
                      <td className="whitespace-nowrap px-3 py-3 font-black text-slate-500">{startIndex + index + 1}</td>
                      <td className="max-w-[280px] px-3 py-3"><div className="font-black">{work.title}</div><div className="mt-1 text-xs font-bold text-slate-500">{work.woNo}</div></td>
                      <td className="whitespace-nowrap px-3 py-3"><WorkOrderStatusBadge status={work.status} /></td>
                      <td className="whitespace-nowrap px-3 py-3"><RequestPriorityBadge priority={work.priority} /></td>
                      <td className="whitespace-nowrap px-3 py-3">{work.departmentCode || work.assetType || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDateCell(work.dueAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-lagoon">{work.asset?.tag ?? work.assetTag ?? "-"}</td>
                      <td className="max-w-[260px] px-3 py-3 text-slate-600">{work.asset?.buildingCode || work.asset?.floor || work.location || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{work.type || "-"}</td>
                      <td className="max-w-[320px] px-3 py-3 text-slate-600"><div className="line-clamp-2">{work.jobPlan || work.workNotes || work.title}</div></td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDateCell(work.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{work.assignedTo?.email ?? work.assignedTeamCode ?? "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDateCell(work.updatedAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-lagoon">{formatDateCell(work.plannedStart)}</td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-[300px] flex-wrap gap-2">
                          <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedWorkId(work.id); setPreviewWork(work); }} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-lagoon ring-1 ring-lagoon/30">Preview</button>
                          {canAssignOrEdit && work.status !== "CLOSED" && <button type="button" disabled={workAction === `${work.id}:edit`} onClick={(event) => { event.stopPropagation(); setSelectedWorkId(work.id); setEditing(work); }} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Edit</button>}
                          {canExecute && work.status !== "CLOSED" && work.status !== "PENDING_SUPERVISOR_REVIEW" && <button type="button" disabled={workAction === `${work.id}:start`} onClick={(event) => { event.stopPropagation(); runWorkAction(`${work.id}:start`, work, () => updateWorkStatus(work.id, "IN_PROGRESS")); }} className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">In Progress</button>}
                          {canExecute && work.status !== "CLOSED" && work.status !== "PENDING_SUPERVISOR_REVIEW" && <button type="button" disabled={workAction === `${work.id}:hold`} onClick={(event) => { event.stopPropagation(); runWorkAction(`${work.id}:hold`, work, () => updateWorkStatus(work.id, "ON_HOLD")); }} className="rounded-lg bg-slate-500 px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">On Hold</button>}
                          {canExecute && work.status !== "CLOSED" && work.status !== "PENDING_SUPERVISOR_REVIEW" && <button type="button" disabled={workAction === `${work.id}:complete`} onClick={(event) => { event.stopPropagation(); runWorkAction(`${work.id}:complete`, work, () => updateWorkStatus(work.id, "COMPLETED")); }} className="rounded-lg bg-leaf px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Submit Review</button>}
                          {canFinalReview && ["PENDING_SUPERVISOR_REVIEW", "COMPLETED"].includes(work.status) && <button type="button" disabled={workAction === `${work.id}:close`} onClick={(event) => { event.stopPropagation(); setSelectedWorkId(work.id); setReviewWork({ work, action: "close" }); }} className="rounded-lg bg-ink px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Close Work Order</button>}
                          {canFinalReview && ["PENDING_SUPERVISOR_REVIEW", "COMPLETED"].includes(work.status) && <button type="button" disabled={workAction === `${work.id}:reopen`} onClick={(event) => { event.stopPropagation(); setSelectedWorkId(work.id); setReviewWork({ work, action: "reopen" }); }} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Reopen</button>}
                          {canAssignOrEdit && work.status !== "CLOSED" && <button type="button" disabled={workAction === `${work.id}:delete`} onClick={(event) => { event.stopPropagation(); runWorkAction(`${work.id}:delete`, work, () => deleteWorkOrder(work.id)); }} className="rounded-lg bg-coral px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={filteredWorks.length} />
            </div>
          </>
        ) : (
          <WorkOrderCalendar works={filteredWorks} monthDate={monthDate} setMonthDate={setMonthDate} setSelectedWorkId={setSelectedWorkId} />
        )}
        {selectedWork && (
          <div className="mt-5">
            <DetailPanel
              title={`Selected Work Order: ${selectedWork.woNo}`}
              rows={[
                ["Title", selectedWork.title],
                ["Status", selectedWork.status],
                ["Priority", selectedWork.priority],
                ["Department", selectedWork.departmentCode],
                ["Service", selectedWork.serviceCode],
                ["Team", selectedWork.assignedTeamCode],
                ["Assigned To", selectedWork.assignedTo?.email ?? selectedWork.assignedToEmail],
                ["Asset", selectedWork.asset?.tag ?? selectedWork.assetTag],
                ["Job Plan", selectedWork.jobPlanCode ?? selectedWork.jobPlan],
                ...workTimingRows(selectedWork),
                ["Work Notes", selectedWork.workNotes],
                ["Pictures", selectedWork.photoUrls],
                ["Inventory Used", selectedWork.inventoryUsed],
                ["Material Request", selectedWork.materialRequest],
              ]}
            />
          </div>
        )}
      </Panel>
      {canAssignOrEdit && createOpen && (
        <RequestModalShell title="New Work Order" onClose={() => setCreateOpen(false)}>
          <WorkOrderForm title="" data={data} onSubmit={async (formData) => { await submitWorkOrder(formData); setCreateOpen(false); }} saving={saving} />
        </RequestModalShell>
      )}
      {editing && canAssignOrEdit && (
        <RequestModalShell title={`Edit ${editing.woNo}`} onClose={() => setEditing(null)}>
          <WorkOrderForm title="" data={data} work={editing} onSubmit={async (formData) => { await updateWorkOrder(editing.id, formData); setEditing(null); }} saving={saving} />
        </RequestModalShell>
      )}
      {previewWork && (
        <WorkOrderPreviewModal
          work={previewWork}
          onClose={() => setPreviewWork(null)}
          onStatusChange={previewWork.status !== "CLOSED" ? (status) => runWorkAction(`${previewWork.id}:${status}`, previewWork, () => updateWorkStatus(previewWork.id, status)) : undefined}
          onPatch={(body) => quickPatchWork(previewWork, body)}
          onEdit={canAssignOrEdit && previewWork.status !== "CLOSED" ? () => { setEditing(previewWork); setPreviewWork(null); } : undefined}
          onCloseWork={canFinalReview && ["PENDING_SUPERVISOR_REVIEW", "COMPLETED"].includes(previewWork.status) ? () => { setReviewWork({ work: previewWork, action: "close" }); setPreviewWork(null); } : undefined}
          onReopenWork={canFinalReview && ["PENDING_SUPERVISOR_REVIEW", "COMPLETED"].includes(previewWork.status) ? () => { setReviewWork({ work: previewWork, action: "reopen" }); setPreviewWork(null); } : undefined}
        />
      )}
      {reviewWork && (
        <WorkOrderSupervisorReviewModal
          work={reviewWork.work}
          action={reviewWork.action}
          teams={data.teams}
          saving={saving}
          onClose={() => setReviewWork(null)}
          onSubmit={async (formData) => {
            await updateWorkOrder(reviewWork.work.id, formData);
            setReviewWork(null);
          }}
        />
      )}
      {selectedWork && canExecute && !canAssignOrEdit && selectedWork.status !== "CLOSED" && selectedWork.status !== "PENDING_SUPERVISOR_REVIEW" && <WorkExecutionForm work={selectedWork} saving={saving} onSubmit={(formData) => updateWorkOrder(selectedWork.id, formData)} />}
    </section>
  );
}

function Helpdesk({
  requests,
  services,
  departments,
  teams,
  locations,
  submitRequest,
  permissions,
  role,
  updateRequest,
  deleteRequest,
  convertRequest,
  saving,
}: {
  requests: any[];
  services: any[];
  departments: any[];
  teams: any[];
  locations: any[];
  submitRequest: (formData: FormData) => void;
  permissions: ActionPermissions;
  role: string;
  updateRequest: (id: string, formData: FormData) => Promise<void> | void;
  deleteRequest: (id: string) => Promise<void> | void;
  convertRequest: (id: string, assignment?: { assignedTeamCode?: string; assignedToEmail?: string }) => Promise<void> | void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<any | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(requests[0]?.id ?? null);
  const [requestAction, setRequestAction] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, { assignedTeamCode: string; assignedToEmail: string }>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const isSupervisorView = roleKindLabel(role) === "admin" || roleKindLabel(role) === "supervisor";
  const categories = ["All", ...Array.from(new Set(requests.map((request) => request.category).filter(Boolean)))];
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const haystack = `${request.ticketNo} ${request.title} ${request.description} ${request.requester} ${request.location} ${request.category} ${request.departmentCode} ${request.serviceCode}`.toLowerCase();
      const queryMatch = !search || haystack.includes(search.toLowerCase());
      const statusMatch = statusFilter === "All" || request.status === statusFilter;
      const priorityMatch = priorityFilter === "All" || request.priority === priorityFilter;
      const categoryMatch = categoryFilter === "All" || request.category === categoryFilter;
      const overdueMatch = !overdueOnly || (request.dueAt ? new Date(request.dueAt).getTime() < Date.now() && request.status !== "CLOSED" : false);
      return queryMatch && statusMatch && priorityMatch && categoryMatch && overdueMatch;
    });
  }, [requests, search, statusFilter, priorityFilter, categoryFilter, overdueOnly]);
  const selectedRequest = filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0] ?? requests[0];
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleRequests = filteredRequests.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    if (filteredRequests.length && !filteredRequests.some((request) => request.id === selectedRequestId)) {
      setSelectedRequestId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedRequestId]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, categoryFilter, overdueOnly, filteredRequests.length]);

  async function runRequestAction(key: string, request: any, action: () => Promise<void> | void) {
    setSelectedRequestId(request.id);
    setRequestAction(key);
    try {
      await action();
    } finally {
      setRequestAction(null);
    }
  }

  function assignmentFor(request: any) {
    return assignments[request.id] ?? { assignedTeamCode: request.assignedTeamCode ?? "", assignedToEmail: "" };
  }

  function setAssignment(requestId: string, next: Partial<{ assignedTeamCode: string; assignedToEmail: string }>) {
    setAssignments((current) => {
      const previous = current[requestId] ?? { assignedTeamCode: "", assignedToEmail: "" };
      return { ...current, [requestId]: { ...previous, ...next } };
    });
  }

  return (
    <section className="space-y-5">
      <Panel title="Helpdesk & SLA Triage" icon={TicketCheck}>
        <ReportButtons type="requests" label="Service requests report" />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="flex h-11 min-w-[250px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <Search size={16} className="text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests" className="w-full text-sm outline-none" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold">
              <option value="All">Status</option>
              <option value="NEW">New</option>
              <option value="TRIAGED">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold">
              <option value="All">Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold">
              {categories.map((category) => <option key={category} value={category}>{category === "All" ? "Category" : category}</option>)}
            </select>
            <button type="button" onClick={() => setOverdueOnly((current) => !current)} className={`h-11 rounded-lg px-3 text-sm font-black ${overdueOnly ? "bg-coral text-white" : "border border-slate-200 bg-white text-slate-600"}`}>Overdue & Due Today</button>
          </div>
          {permissions.manageRequests && <button type="button" onClick={() => { setEditing(null); setCreateOpen(true); }} className="flex h-11 items-center gap-2 rounded-lg bg-lagoon px-4 text-sm font-black text-white shadow-sm"><Plus size={16} /> Request</button>}
        </div>

        <div className="overflow-auto rounded-lg border border-slate-200 scrollbar-thin">
          <table className="min-w-[1500px] border-collapse bg-white text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 font-black">#</th>
                <th className="px-3 py-3 font-black">Title</th>
                <th className="px-3 py-3 font-black">Status</th>
                <th className="px-3 py-3 font-black">Priority</th>
                <th className="px-3 py-3 font-black">Category</th>
                <th className="px-3 py-3 font-black">Created when</th>
                <th className="px-3 py-3 font-black">Needed by</th>
                <th className="px-3 py-3 font-black">Location</th>
                <th className="px-3 py-3 font-black">Department</th>
                <th className="px-3 py-3 font-black">Service</th>
                <th className="px-3 py-3 font-black">Description</th>
                <th className="px-3 py-3 font-black">Created by</th>
                <th className="px-3 py-3 font-black">Supervisor</th>
                <th className="px-3 py-3 font-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((request, index) => {
                const assignment = assignmentFor(request);
                return (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className={`cursor-pointer border-t border-slate-100 align-top ${selectedRequest?.id === request.id ? "bg-lagoon/5" : "hover:bg-slate-50"}`}
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-black text-slate-500">{startIndex + index + 1}</td>
                    <td className="max-w-[280px] px-3 py-3">
                      <div className="font-black text-slate-800">{request.title}</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">{request.ticketNo}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3"><RequestStatusBadge status={request.status} /></td>
                    <td className="whitespace-nowrap px-3 py-3"><RequestPriorityBadge priority={request.priority} /></td>
                    <td className="whitespace-nowrap px-3 py-3">{request.category || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateCell(request.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateCell(request.dueAt)}</td>
                    <td className="max-w-[260px] px-3 py-3 text-slate-600">{request.location || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{request.departmentCode || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{request.serviceCode || "-"}</td>
                    <td className="max-w-[320px] px-3 py-3 text-slate-600"><div className="line-clamp-2">{request.description || "-"}</div></td>
                    <td className="whitespace-nowrap px-3 py-3">{request.requester || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{request.assignedSupervisorEmail || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-[260px] flex-wrap gap-2">
                        {isSupervisorView && permissions.manageRequests && <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedRequestId(request.id); setEditing(request); }} className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white">Edit</button>}
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedRequestId(request.id); setPreviewRequest(request); }} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-black text-white">Preview</button>
                        {isSupervisorView && permissions.manageRequests && <button type="button" disabled={Boolean(request.workOrder) || requestAction === `${request.id}:wo`} onClick={(event) => { event.stopPropagation(); runRequestAction(`${request.id}:wo`, request, () => convertRequest(request.id, { assignedTeamCode: assignment.assignedTeamCode })); }} className="rounded-lg bg-ink px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">{requestAction === `${request.id}:wo` ? "Creating..." : request.workOrder ? "WO Created" : "Create WO"}</button>}
                        {isSupervisorView && permissions.approveRequests && <button type="button" disabled={requestAction === `${request.id}:reject`} onClick={(event) => { event.stopPropagation(); runRequestAction(`${request.id}:reject`, request, () => updateRequest(request.id, requestFormData(request, "REJECTED", "Rejected by supervisor/helpdesk", { assignedTeamCode: assignment.assignedTeamCode }))); }} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">{requestAction === `${request.id}:reject` ? "Saving..." : "Reject"}</button>}
                        {isSupervisorView && permissions.manageRequests && <button type="button" disabled={requestAction === `${request.id}:delete`} onClick={(event) => { event.stopPropagation(); runRequestAction(`${request.id}:delete`, request, () => deleteRequest(request.id)); }} className="rounded-lg bg-coral px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">{requestAction === `${request.id}:delete` ? "Deleting..." : "Delete"}</button>}
                      </div>
                      {isSupervisorView && permissions.manageRequests && (
                        <select
                          value={assignment.assignedTeamCode}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => setAssignment(request.id, { assignedTeamCode: event.target.value, assignedToEmail: "" })}
                          className="mt-2 h-10 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lagoon"
                        >
                          <option value="">Assign service team</option>
                          {teams.map((team) => <option key={team.id} value={team.code}>{team.code} - {team.name}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={filteredRequests.length} />
        </div>

        {selectedRequest && (
          <div className="mt-5">
            <DetailPanel
              title={`Selected Request: ${selectedRequest.ticketNo}`}
              rows={[
                ["Title", selectedRequest.title],
                ["Status", selectedRequest.status],
                ["Priority", selectedRequest.priority],
                ["Category", selectedRequest.category],
                ["Department", selectedRequest.departmentCode],
                ["Service", selectedRequest.serviceCode],
                ["Team", selectedRequest.assignedTeamCode],
                ["Supervisor", selectedRequest.assignedSupervisorEmail],
                ["Requester", selectedRequest.requester],
                ["Location", selectedRequest.location],
                ["Description", selectedRequest.description],
                ["Attachments", selectedRequest.attachmentUrls],
                ["Reject Reason", selectedRequest.rejectionReason],
                ["Linked Work Order", selectedRequest.workOrder?.woNo],
              ]}
            />
          </div>
        )}
      </Panel>
      {permissions.manageRequests && createOpen && (
        <RequestModalShell title="New Request" onClose={() => setCreateOpen(false)}>
          <ServiceRequestForm
            title=""
            services={services}
            departments={departments}
            teams={teams}
            locations={locations}
            onSubmit={async (formData) => {
              await submitRequest(formData);
              setCreateOpen(false);
            }}
            saving={saving}
            mode="modal"
          />
        </RequestModalShell>
      )}
      {editing && permissions.manageRequests && (
        <RequestModalShell title={`Edit ${editing.ticketNo}`} onClose={() => setEditing(null)}>
          <ServiceRequestForm
            title=""
            request={editing}
            services={services}
            departments={departments}
            teams={teams}
            locations={locations}
            onSubmit={async (formData) => {
              await updateRequest(editing.id, formData);
              setEditing(null);
            }}
            saving={saving}
            mode="modal"
          />
        </RequestModalShell>
      )}
      {previewRequest && (
        <RequestPreviewModal
          request={previewRequest}
          teams={teams}
          assignment={assignmentFor(previewRequest)}
          canManage={isSupervisorView && permissions.manageRequests}
          canApprove={isSupervisorView && permissions.approveRequests}
          savingKey={requestAction}
          onClose={() => setPreviewRequest(null)}
          onEdit={() => {
            setPreviewRequest(null);
            setEditing(previewRequest);
          }}
          onAssignTeam={(value) => setAssignment(previewRequest.id, { assignedTeamCode: value, assignedToEmail: "" })}
          onReview={() => runRequestAction(`${previewRequest.id}:review`, previewRequest, () => updateRequest(previewRequest.id, requestFormData(previewRequest, "TRIAGED", "", { assignedTeamCode: assignmentFor(previewRequest).assignedTeamCode })))}
          onCreateWorkOrder={async () => {
            await runRequestAction(`${previewRequest.id}:wo`, previewRequest, () => convertRequest(previewRequest.id, { assignedTeamCode: assignmentFor(previewRequest).assignedTeamCode }));
            setPreviewRequest(null);
          }}
          onReject={() => runRequestAction(`${previewRequest.id}:reject`, previewRequest, () => updateRequest(previewRequest.id, requestFormData(previewRequest, "REJECTED", "Rejected by supervisor/helpdesk", { assignedTeamCode: assignmentFor(previewRequest).assignedTeamCode })))}
        />
      )}
    </section>
  );
}

function requestFormData(request: any, status: string, rejectionReason = "", overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("title", request.title ?? "");
  formData.set("category", request.category ?? "General");
  formData.set("departmentCode", request.departmentCode ?? "");
  formData.set("serviceCode", request.serviceCode ?? "");
  formData.set("assignedTeamCode", overrides.assignedTeamCode ?? request.assignedTeamCode ?? "");
  formData.set("requester", request.requester ?? "Requester");
  formData.set("priority", request.priority ?? "MEDIUM");
  formData.set("status", status);
  formData.set("location", request.location ?? "Unassigned");
  formData.set("attachmentUrls", request.attachmentUrls ?? "");
  formData.set("rejectionReason", rejectionReason || request.rejectionReason || "");
  formData.set("description", request.description ?? request.title ?? "Request reviewed.");
  return formData;
}

function ServiceRequestForm({ title, request, services, departments, teams, locations, onSubmit, saving, mode = "panel" }: { title: string; request?: any; services: any[]; departments: any[]; teams: any[]; locations: any[]; onSubmit: (formData: FormData) => void; saving: boolean; mode?: "panel" | "modal" }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await onSubmit(new FormData(form));
    if (!request) form.reset();
  }

  const locationOptions = locations.map((location) => `${location.site} / ${location.building} / ${location.floor} / ${location.room}`);
  const formClass = mode === "modal" ? "" : "rounded-lg border border-white/80 bg-white p-5 shadow-lift";
  const [priority, setPriority] = useState(request?.priority ?? "MEDIUM");
  const priorities = [
    { value: "LOW", label: "Low", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "MEDIUM", label: "Medium", tone: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "HIGH", label: "High", tone: "bg-orange-50 text-orange-700 border-orange-200" },
    { value: "CRITICAL", label: "Critical", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  return (
    <form onSubmit={handleSubmit} className={formClass}>
      {title ? <h3 className="text-xl font-black">{title}</h3> : null}
      <div className={`${title ? "mt-4" : ""} grid gap-4`}>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">
          Upload images or files by drag and drop, or paste links below.
        </div>
        <input name="title" defaultValue={request?.title ?? ""} placeholder="Title" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Description
          <textarea name="description" defaultValue={request?.description ?? ""} placeholder="Describe the issue" className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        </label>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <span className="text-sm font-black text-slate-600">Priority</span>
          {priorities.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPriority(item.value)}
              className={`rounded-lg border px-3 py-2 text-xs font-black ${priority === item.value ? item.tone : "border-slate-200 bg-white text-slate-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="priority" value={priority} />
        <select name="location" defaultValue={request?.location ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Location</option>
          {locationOptions.map((location) => <option key={location}>{location}</option>)}
        </select>
        <div className="grid gap-3 md:grid-cols-2">
          <select name="category" defaultValue={request?.category ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option value="">Category</option>
            {Array.from(new Set(services.map((service) => service.category).filter(Boolean))).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input name="requester" defaultValue={request?.requester ?? ""} placeholder="Created by / requester" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select name="departmentCode" defaultValue={request?.departmentCode ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option value="">Department</option>
            {departments.map((department) => <option key={department.id} value={department.code}>{department.code} - {department.name}</option>)}
          </select>
          <select name="serviceCode" defaultValue={request?.serviceCode ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option value="">Service</option>
            {services.map((service) => <option key={service.id} value={service.code}>{service.code} - {service.name}</option>)}
          </select>
        </div>
        {request && (
          <select name="status" defaultValue={request.status} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option>NEW</option><option>TRIAGED</option><option>APPROVED</option><option>REJECTED</option><option>ASSIGNED</option><option>CLOSED</option>
          </select>
        )}
        {!request && <input type="hidden" name="status" value="NEW" />}
        <input type="hidden" name="assignedTeamCode" value={request?.assignedTeamCode ?? ""} />
        <ImageUploadField name="attachmentUrls" defaultValue={request?.attachmentUrls ?? ""} />
        {request && <textarea name="rejectionReason" defaultValue={request?.rejectionReason ?? ""} placeholder="Reject / close reason" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={saving} className="h-11 rounded-lg bg-ink px-5 font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </form>
  );
}

function RequestModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 p-4 pt-20 backdrop-blur-sm">
      <div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-ink px-4 py-3 text-white">
          <h3 className="text-sm font-black">{title}</h3>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-cyan-400 px-3 py-2 text-xs font-black text-cyan-300">Cancel</button>
          </div>
        </div>
        <div className="max-h-[calc(86vh-56px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function RequestPreviewModal({
  request,
  teams,
  assignment,
  canManage,
  canApprove,
  savingKey,
  onClose,
  onEdit,
  onAssignTeam,
  onReview,
  onCreateWorkOrder,
  onReject,
}: {
  request: any;
  teams: any[];
  assignment: { assignedTeamCode: string; assignedToEmail: string };
  canManage: boolean;
  canApprove: boolean;
  savingKey: string | null;
  onClose: () => void;
  onEdit: () => void;
  onAssignTeam: (value: string) => void;
  onReview: () => Promise<void> | void;
  onCreateWorkOrder: () => Promise<void> | void;
  onReject: () => Promise<void> | void;
}) {
  const images = attachmentList(request.attachmentUrls);
  const reviewedStatuses = ["TRIAGED", "APPROVED"];
  const isReviewed = reviewedStatuses.includes(request.status) || Boolean(request.workOrder);
  const canCreateWorkOrder = canManage && isReviewed && !request.workOrder;

  return (
    <RequestModalShell title={`Request Preview: ${request.ticketNo}`} onClose={onClose}>
      <div className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black">{request.title}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{request.ticketNo} / {request.requester || "Requester"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RequestStatusBadge status={request.status} />
            <RequestPriorityBadge priority={request.priority} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <PreviewField label="Category" value={request.category} />
          <PreviewField label="Department" value={request.departmentCode} />
          <PreviewField label="Service" value={request.serviceCode} />
          <PreviewField label="Location" value={request.location} />
          <PreviewField label="Created" value={formatDateCell(request.createdAt)} />
          <PreviewField label="Needed by" value={formatDateCell(request.dueAt)} />
          <PreviewField label="Supervisor" value={request.assignedSupervisorEmail} />
          <PreviewField label="Linked Work Order" value={request.workOrder?.woNo} />
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">Description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-700">{request.description || "-"}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase text-slate-500">Images / Attachments</p>
          {images.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {images.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {isImageUrl(url) ? <img src={url} alt="Request attachment" className="h-36 w-full object-cover" /> : <span className="block p-3 text-sm font-bold text-lagoon">{url}</span>}
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No images attached.</p>
          )}
        </div>

        {canManage && (
          <label className="grid gap-2 text-sm font-black text-slate-600">
            Step 2: assign service team before creating work order
            <select
              value={assignment.assignedTeamCode}
              onChange={(event) => onAssignTeam(event.target.value)}
              disabled={!isReviewed}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lagoon"
            >
              <option value="">Assign service team</option>
              {teams.map((team) => <option key={team.id} value={team.code}>{team.code} - {team.name}</option>)}
            </select>
            {!isReviewed && <span className="text-xs font-bold text-amber-700">First change status to Reviewed, then select team and create work order.</span>}
          </label>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-black uppercase text-slate-500">Workflow</p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div className={`rounded-lg p-3 text-sm font-black ${isReviewed ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-700"}`}>1. Change status to Reviewed</div>
            <div className={`rounded-lg p-3 text-sm font-black ${isReviewed ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>2. Assign service team</div>
            <div className={`rounded-lg p-3 text-sm font-black ${canCreateWorkOrder ? "bg-white text-slate-700" : "bg-slate-100 text-slate-400"}`}>3. Create Work Order</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          {canManage && <button type="button" onClick={onEdit} className="rounded-lg bg-lagoon px-4 py-3 text-sm font-black text-white">Edit</button>}
          {canApprove && <button type="button" disabled={isReviewed || savingKey === `${request.id}:review`} onClick={onReview} className="rounded-lg bg-slate-700 px-4 py-3 text-sm font-black text-white disabled:bg-slate-400">{savingKey === `${request.id}:review` ? "Saving..." : isReviewed ? "Status Reviewed" : "Change Status to Reviewed"}</button>}
          {canManage && <button type="button" disabled={!canCreateWorkOrder || savingKey === `${request.id}:wo`} onClick={onCreateWorkOrder} className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white disabled:bg-slate-400">{savingKey === `${request.id}:wo` ? "Creating..." : request.workOrder ? "WO Created" : isReviewed ? "Create Work Order" : "Create Work Order Locked"}</button>}
          {canApprove && <button type="button" disabled={savingKey === `${request.id}:reject`} onClick={onReject} className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-black text-white disabled:bg-slate-400">Reject</button>}
        </div>
      </div>
    </RequestModalShell>
  );
}

function WorkOrderPreviewModal({
  work,
  onClose,
  onStatusChange,
  onPatch,
  onEdit,
  onCloseWork,
  onReopenWork,
}: {
  work: any;
  onClose: () => void;
  onStatusChange?: (status: string) => Promise<void> | void;
  onPatch?: (body: Record<string, string>) => Promise<void> | void;
  onEdit?: () => void;
  onCloseWork?: () => void;
  onReopenWork?: () => void;
}) {
  const attachments = [...attachmentList(work.photoUrls), ...attachmentList(work.request?.attachmentUrls)];
  const images = attachments.filter(isImageUrl);
  const files = attachments.filter((item) => !isImageUrl(item));
  const [activeImage, setActiveImage] = useState(images[0] ?? "");
  const [zoom, setZoom] = useState(1);
  const [quickForm, setQuickForm] = useState<"" | "procedure" | "part" | "cost">("");
  const [quickValue, setQuickValue] = useState("");
  const timelineRows: [string, unknown][] = [
    ["Created", work.createdAt],
    ["Assigned / Planned", work.plannedStart],
    ["First Response", work.responseAt],
    ["Completed by Team", work.resolutionAt],
    ["Supervisor Review", work.verifiedAt],
    ["Closed", work.finishedAt],
    ["Last Updated", work.updatedAt],
  ];
  const checklist = checklistItems(work.jobPlan || work.request?.description || work.title);
  const historyRows = [
    ["Created", work.createdAt, `Work order ${work.woNo} was created.`],
    ["Status", work.responseAt, `Moved to ${work.status?.replaceAll("_", " ") || "Open"}.`],
    ["Completed when", work.resolutionAt, "Service team submitted completion for supervisor review."],
    ["Closed", work.finishedAt, work.supervisorDecision || "Final supervisor review pending."],
  ].filter(([, date]) => Boolean(date));

  async function saveQuick(kind: "procedure" | "part" | "cost") {
    const value = quickValue.trim();
    if (!value) return;
    if (kind === "procedure") await onPatch?.({ jobPlan: [work.jobPlan, value].filter(Boolean).join("\n") });
    if (kind === "part") await onPatch?.({ materialRequest: [work.materialRequest, value].filter(Boolean).join("\n") });
    if (kind === "cost") await onPatch?.({ cost: value });
    setQuickValue("");
    setQuickForm("");
  }

  return (
    <RequestModalShell title={`Work Order Preview: ${work.woNo}`} onClose={onClose}>
      <div className="grid gap-5">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <button type="button" disabled={!onStatusChange || work.status === "CLOSED"} onClick={() => onStatusChange?.("ASSIGNED")} className={`rounded-lg border px-3 py-3 text-xs font-black ${["OPEN", "NEW", "ASSIGNED", "REOPENED"].includes(work.status) ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"} disabled:opacity-50`}>Open</button>
            <button type="button" disabled={!onStatusChange || work.status === "CLOSED"} onClick={() => onStatusChange?.("ON_HOLD")} className={`rounded-lg border px-3 py-3 text-xs font-black ${work.status === "ON_HOLD" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600"} disabled:opacity-50`}>On Hold</button>
            <button type="button" disabled={!onStatusChange || work.status === "CLOSED"} onClick={() => onStatusChange?.("IN_PROGRESS")} className={`rounded-lg border px-3 py-3 text-xs font-black ${work.status === "IN_PROGRESS" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"} disabled:opacity-50`}>In Progress</button>
            <button type="button" disabled={!onStatusChange || work.status === "CLOSED"} onClick={() => onStatusChange?.("COMPLETED")} className={`rounded-lg border px-3 py-3 text-xs font-black ${work.status === "PENDING_SUPERVISOR_REVIEW" ? "border-violet-400 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600"} disabled:opacity-50`}>In Review</button>
            <button type="button" disabled={!onStatusChange || work.status === "CLOSED"} onClick={() => onStatusChange?.("COMPLETED")} className={`rounded-lg border px-3 py-3 text-xs font-black ${["COMPLETED", "CLOSED"].includes(work.status) ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"} disabled:opacity-50`}>Completed</button>
          </div>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black">{work.title}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{work.woNo} / Linked request {work.request?.ticketNo || "-"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <WorkOrderStatusBadge status={work.status} />
            <RequestPriorityBadge priority={work.priority} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <PreviewField label="Department" value={work.departmentCode} />
          <PreviewField label="Location" value={work.request?.location || work.asset?.location || work.asset?.buildingCode || work.location} />
          <PreviewField label="Category / Service" value={work.serviceCode || work.type || work.request?.category} />
          <PreviewField label="Assigned Team" value={work.assignedTeamCode} />
          <PreviewField label="Assigned Member" value={work.assignedTo?.name || work.assignedTo?.email} />
          <PreviewField label="Due Date" value={formatDateCell(work.dueAt)} />
          <PreviewField label="Asset" value={work.asset?.tag || work.assetTag} />
          <PreviewField label="Work Type" value={work.type} />
          <PreviewField label="Schedule" value={work.jobPlanCode || work.frequency || work.plannedStart} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">Request Details</p>
            <p className="mt-2 text-sm font-black text-slate-700">{work.request?.title || work.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-600">{work.request?.description || work.jobPlan || "-"}</p>
            <p className="mt-3 text-xs font-black text-slate-500">Requester: {work.request?.requester || "-"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">Service Team Updates</p>
            <div className="mt-2 grid gap-2">
              <PreviewField label="Work Notes" value={work.workNotes} />
              <PreviewField label="Parts / Materials Requested" value={work.materialRequest} />
              <PreviewField label="Assets Used" value={work.assetsUsed} />
              <PreviewField label="Inventory Used" value={work.inventoryUsed} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-black uppercase text-slate-500">Attachments & Image Gallery</p>
              {activeImage && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black">Zoom -</button>
                  <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black">Zoom +</button>
                  <a href={activeImage} download className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white">Download</a>
                </div>
              )}
            </div>
            {activeImage ? (
              <div className="mt-3 grid place-items-center overflow-auto rounded-lg bg-slate-950/90 p-4">
                <img src={activeImage} alt="Work order proof preview" style={{ transform: `scale(${zoom})` }} className="max-h-[420px] max-w-full origin-center rounded-lg object-contain transition-transform" />
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No image proof uploaded.</p>
            )}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">
                {images.map((url) => (
                  <button key={url} type="button" onClick={() => { setActiveImage(url); setZoom(1); }} className={`overflow-hidden rounded-lg border ${activeImage === url ? "border-lagoon ring-2 ring-lagoon/20" : "border-slate-200"}`}>
                    <img src={url} alt="Attachment thumbnail" className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {files.length > 0 && (
              <div className="mt-3 grid gap-2">
                {files.map((file) => (
                  <div key={file} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold">
                    <span className="break-all">{file}</span>
                    <a href={file} download className="text-lagoon">Download</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs font-black uppercase text-amber-700">Supervisor Review</p>
              <PreviewField label="Reopen Reason" value={work.rejectionReason} />
              <div className="mt-2">
                <PreviewField label="Closing / Review Remarks" value={work.supervisorDecision} />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Timeline</p>
              <div className="mt-2 grid gap-2">
                {timelineRows.map(([label, value]) => <PreviewField key={label} label={label} value={formatDateCell(value as string)} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 rounded-lg bg-slate-50 p-4 md:grid-cols-3">
          {workTimingRows(work).map(([label, value]) => <PreviewField key={label} label={label} value={label.includes("Time") ? formatDateCell(value as string) : value} />)}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-black">Procedures & Checklist</h4>
              <button type="button" onClick={() => setQuickForm(quickForm === "procedure" ? "" : "procedure")} disabled={!onPatch} className="rounded-lg border border-lagoon/30 px-3 py-2 text-xs font-black text-lagoon disabled:opacity-50">Add Procedure</button>
            </div>
            {quickForm === "procedure" && (
              <div className="mt-3 flex gap-2">
                <input value={quickValue} onChange={(event) => setQuickValue(event.target.value)} placeholder="Procedure / checklist step" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon" />
                <button type="button" onClick={() => saveQuick("procedure")} className="rounded-lg bg-lagoon px-4 text-sm font-black text-white">Save</button>
              </div>
            )}
            <div className="mt-3 grid gap-2">
              {checklist.map((item, index) => (
                <label key={`${item}-${index}`} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  <input type="checkbox" defaultChecked={["COMPLETED", "PENDING_SUPERVISOR_REVIEW", "CLOSED"].includes(work.status)} className="mt-1" />
                  <span>{index + 1}. {item}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between"><h4 className="font-black">Time</h4><button type="button" onClick={() => onStatusChange?.("IN_PROGRESS")} disabled={!onStatusChange || work.status === "CLOSED"} className="rounded-lg border border-lagoon/30 px-3 py-2 text-xs font-black text-lagoon disabled:opacity-50">Start Timer</button></div>
              <div className="mt-3 grid gap-2">
                <PreviewField label="Response" value={minutesBetween(work.createdAt, work.responseAt)} />
                <PreviewField label="Resolution" value={minutesBetween(work.responseAt, work.resolutionAt)} />
                <PreviewField label="Finish" value={minutesBetween(work.resolutionAt, work.finishedAt)} />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between"><h4 className="font-black">Parts</h4><button type="button" onClick={() => setQuickForm(quickForm === "part" ? "" : "part")} disabled={!onPatch} className="rounded-lg border border-lagoon/30 px-3 py-2 text-xs font-black text-lagoon disabled:opacity-50">Add Part</button></div>
              {quickForm === "part" && (
                <div className="mt-3 flex gap-2">
                  <input value={quickValue} onChange={(event) => setQuickValue(event.target.value)} placeholder="Part name / quantity" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon" />
                  <button type="button" onClick={() => saveQuick("part")} className="rounded-lg bg-lagoon px-4 text-sm font-black text-white">Save</button>
                </div>
              )}
              <p className="mt-2 text-sm font-bold text-slate-600">{work.materialRequest || work.inventoryUsed || "No parts added."}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between"><h4 className="font-black">Other Costs</h4><button type="button" onClick={() => setQuickForm(quickForm === "cost" ? "" : "cost")} disabled={!onPatch} className="rounded-lg border border-lagoon/30 px-3 py-2 text-xs font-black text-lagoon disabled:opacity-50">Add Cost</button></div>
              {quickForm === "cost" && (
                <div className="mt-3 flex gap-2">
                  <input value={quickValue} onChange={(event) => setQuickValue(event.target.value)} type="number" placeholder="Cost amount" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon" />
                  <button type="button" onClick={() => saveQuick("cost")} className="rounded-lg bg-lagoon px-4 text-sm font-black text-white">Save</button>
                </div>
              )}
              <p className="mt-2 text-sm font-black text-slate-700">{work.cost ? `$${work.cost}` : "No extra costs."}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex gap-6 border-b border-slate-200 text-sm font-black">
            <span className="border-b-2 border-lagoon px-2 pb-3 text-lagoon">WO Comments</span>
            <span className="px-2 pb-3 text-slate-500">History</span>
          </div>
          <div className="mt-4 grid gap-4">
            {historyRows.map(([label, date, note]) => (
              <div key={`${label}-${date}`} className="grid gap-1 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-lagoon">{label}</p>
                  <p className="text-xs font-bold text-slate-500">{formatDateCell(date as string)}</p>
                </div>
                <p className="font-bold text-slate-700">{note}</p>
              </div>
            ))}
            <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600">{work.workNotes || "No additional comments yet."}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          {onEdit && <button type="button" onClick={onEdit} className="rounded-lg bg-lagoon px-4 py-3 text-sm font-black text-white">Edit</button>}
          {onReopenWork && <button type="button" onClick={onReopenWork} className="rounded-lg bg-amber-600 px-4 py-3 text-sm font-black text-white">Reopen Work Order</button>}
          {onCloseWork && <button type="button" onClick={onCloseWork} className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white">Close Work Order</button>}
        </div>
      </div>
    </RequestModalShell>
  );
}

function WorkOrderSupervisorReviewModal({
  work,
  action,
  teams,
  saving,
  onClose,
  onSubmit,
}: {
  work: any;
  action: "close" | "reopen";
  teams: any[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void> | void;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
  }
  const isReopen = action === "reopen";

  return (
    <RequestModalShell title={`${isReopen ? "Reopen" : "Close"} Work Order: ${work.woNo}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input type="hidden" name="status" value={isReopen ? "REOPENED" : "CLOSED"} />
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-lg font-black">{work.title}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{work.departmentCode || "-"} / {work.assignedTeamCode || "No team assigned"}</p>
        </div>
        {isReopen ? (
          <>
            <label className="grid gap-2 text-sm font-black text-slate-600">
              Reopen Reason
              <input name="rejectionReason" required placeholder="Why completion is rejected" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-600">
              Remarks / Instructions
              <textarea name="supervisorDecision" required placeholder="Instructions for service team before resubmitting" className="min-h-28 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-600">
              Reassigned Service Team
              <select name="assignedTeamCode" defaultValue={work.assignedTeamCode ?? ""} className="h-11 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-lagoon">
                <option value="">Keep unassigned</option>
                {teams.map((team) => <option key={team.id} value={team.code}>{team.code} - {team.name}</option>)}
              </select>
            </label>
          </>
        ) : (
          <label className="grid gap-2 text-sm font-black text-slate-600">
            Final Remarks
            <textarea name="supervisorDecision" placeholder="Final verification remarks. Closing time and supervisor are captured automatically." className="min-h-28 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
          </label>
        )}
        <button disabled={saving} className={`h-11 rounded-lg font-black text-white disabled:bg-slate-400 ${isReopen ? "bg-amber-600" : "bg-ink"}`}>
          {saving ? "Saving..." : isReopen ? "Reopen Work Order" : "Close Work Order"}
        </button>
      </form>
    </RequestModalShell>
  );
}

function PreviewField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-700">{String(value || "-")}</p>
    </div>
  );
}

function attachmentList(value: unknown) {
  return String(value || "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isImageUrl(value: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(value) || value.startsWith("/uploads/");
}

function checklistItems(value: unknown) {
  const items = String(value || "")
    .split(/\r?\n|(?:^|\s)\d+[.)]\s+/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter((item) => item.length > 3);
  return items.length ? items.slice(0, 12) : [
    "Check filters and replace if required",
    "Check fan blades for dust buildup and clean if necessary",
    "Check moving parts for cracks and excessive wear",
    "Verify safety isolation and lockout requirements",
    "Record completion notes, time, parts and proof photos",
  ];
}

function RequestStatusBadge({ status }: { status: string }) {
  const tone =
    status === "CLOSED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
    status === "APPROVED" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
    "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={`rounded-full border px-2 py-1 text-xs font-black ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

function RequestPriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === "CRITICAL" ? "text-rose-700" :
    priority === "HIGH" ? "text-orange-700" :
    priority === "MEDIUM" ? "text-amber-700" :
    "text-emerald-700";
  return <span className={`text-xs font-black uppercase ${tone}`}>{priority}</span>;
}

function formatDateCell(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function WorkOrderStatusBadge({ status }: { status: string }) {
  const tone =
    status === "CLOSED" || status === "VERIFIED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    status === "IN_PROGRESS" || status === "ASSIGNED" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
    status === "PENDING_SUPERVISOR_REVIEW" ? "bg-violet-50 text-violet-700 border-violet-200" :
    status === "ON_HOLD" || status === "REOPENED" ? "bg-amber-50 text-amber-700 border-amber-200" :
    status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
    "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`rounded-full border px-2 py-1 text-xs font-black ${tone}`}>{status?.replaceAll("_", " ") || "OPEN"}</span>;
}

function WorkOrderCalendar({ works, monthDate, setMonthDate, setSelectedWorkId }: { works: any[]; monthDate: Date; setMonthDate: (date: Date) => void; setSelectedWorkId: (id: string) => void }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const monthLabel = monthDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const worksByDay = works.reduce((acc: Record<string, any[]>, work) => {
    const value = work.dueAt || work.plannedStart || work.createdAt;
    if (!value) return acc;
    const key = new Date(value).toISOString().slice(0, 10);
    acc[key] = [...(acc[key] ?? []), work];
    return acc;
  }, {});

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMonthDate(new Date(year, month - 1, 1))} className="h-9 rounded-lg border border-slate-200 px-3 text-lagoon">{"<"}</button>
          <button type="button" onClick={() => setMonthDate(new Date(year, month + 1, 1))} className="h-9 rounded-lg border border-slate-200 px-3 text-lagoon">{">"}</button>
          <h4 className="text-2xl font-black">{monthLabel}</h4>
        </div>
        <div className="flex rounded-lg border border-lagoon text-sm font-black text-lagoon">
          <span className="px-3 py-2">Week</span>
          <span className="bg-lagoon px-3 py-2 text-white">Month</span>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center text-xs font-black">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="border-r border-slate-200 p-2 last:border-r-0">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const dayWorks = worksByDay[key] ?? [];
          const inMonth = day.getMonth() === month;
          const isToday = key === new Date().toISOString().slice(0, 10);
          return (
            <div key={key} className={`min-h-32 border-b border-r border-slate-200 p-2 last:border-r-0 ${inMonth ? "bg-white" : "bg-slate-100"} ${isToday ? "bg-lime-50" : ""}`}>
              <div className={`mb-2 grid h-6 w-6 place-items-center rounded-full text-xs font-black ${isToday ? "bg-lime-400 text-ink" : "text-slate-500"}`}>{day.getDate()}</div>
              <div className="grid gap-1">
                {dayWorks.slice(0, 4).map((work) => (
                  <button key={work.id} type="button" onClick={() => setSelectedWorkId(work.id)} className="truncate rounded bg-slate-50 px-2 py-1 text-left text-xs font-bold text-slate-700 hover:bg-lagoon/10">
                    {work.title} <span className="text-coral">{work.priority === "CRITICAL" ? "!" : ""}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImageUploadField({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const urls = value.split(/\s+/).map((item) => item.trim()).filter(Boolean);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    setUploading(true);
    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const result = await response.json();
    const next = [...urls, ...(result.urls ?? [])].join("\n");
    setValue(next);
    setUploading(false);
  }

  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
      <input type="hidden" name={name} value={value} />
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-white p-4 text-center text-sm font-bold text-slate-600">
        <Upload size={18} className="text-lagoon" />
        {uploading ? "Uploading..." : "Upload images"}
        <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => upload(event.target.files)} />
      </label>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="Uploaded image URLs" className="min-h-20 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-lagoon" />
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {urls.slice(0, 6).map((url) => (
            <img key={url} src={url} alt="Uploaded proof" className="h-20 w-full rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkOrderForm({ title, work, data, onSubmit, saving }: { title: string; work?: any; data: ConsoleData; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await onSubmit(new FormData(form));
    if (!work) form.reset();
  }

  const assetTypes = Array.from(new Set(data.assets.map((asset) => asset.assetGroup || asset.category).filter(Boolean)));

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 grid gap-3">
        <input name="title" defaultValue={work?.title ?? ""} placeholder="Title" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <input name="type" defaultValue={work?.type ?? ""} placeholder="Work type" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <select name="assetType" defaultValue={work?.assetType ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select asset type</option>
          {assetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="assetTag" defaultValue={work?.asset?.tag ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select asset</option>
          {data.assets.map((asset) => <option key={asset.id} value={asset.tag}>{asset.tag} - {asset.assetDescription ?? asset.name}</option>)}
        </select>
        <select name="departmentCode" defaultValue={work?.departmentCode ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select department</option>
          {data.departments.map((department) => <option key={department.id} value={department.code}>{department.code} - {department.name}</option>)}
        </select>
        <select name="serviceCode" defaultValue={work?.serviceCode ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select service</option>
          {data.services.map((service) => <option key={service.id} value={service.code}>{service.code} - {service.name}</option>)}
        </select>
        <select name="assignedTeamCode" defaultValue={work?.assignedTeamCode ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Assign service team</option>
          {data.teams.map((team) => <option key={team.id} value={team.code}>{team.code} - {team.name}</option>)}
        </select>
        <select name="jobPlanCode" defaultValue={work?.jobPlanCode ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select job plan</option>
          {data.jobPlans.map((plan) => <option key={plan.id} value={plan.code}>{plan.code} - {plan.name}</option>)}
        </select>
        <select name="priority" defaultValue={work?.priority ?? "MEDIUM"} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
        </select>
        {work && <select name="status" defaultValue={work.status} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon"><option>PENDING_ASSIGNMENT</option><option>ASSIGNED</option><option>ACCEPTED</option><option>REJECTED</option><option>IN_PROGRESS</option><option>ON_HOLD</option><option>COMPLETED</option><option>PENDING_SUPERVISOR_REVIEW</option><option>VERIFIED</option><option>REOPENED</option><option>CLOSED</option></select>}
        <textarea name="jobPlan" defaultValue={work?.jobPlan ?? ""} placeholder="Job plan / work steps" className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        <textarea name="safetyNotes" defaultValue={work?.safetyNotes ?? ""} placeholder="Safety notes" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        <ImageUploadField name="photoUrls" defaultValue={work?.photoUrls ?? ""} />
        {work && (
          <div className="grid gap-3 rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-700">Team Member Update</p>
            <input name="responseAt" type="datetime-local" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            <input name="resolutionAt" type="datetime-local" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            <input name="finishedAt" type="datetime-local" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            <textarea name="assetsUsed" defaultValue={work.assetsUsed ?? ""} placeholder="Assets added or used" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            <textarea name="inventoryUsed" defaultValue={work.inventoryUsed ?? ""} placeholder="Inventory/spares used" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            <textarea name="workNotes" defaultValue={work.workNotes ?? ""} placeholder="Work notes / execution log" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            <textarea name="materialRequest" defaultValue={work.materialRequest ?? ""} placeholder="Material request to supervisor" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            <textarea name="rejectionReason" defaultValue={work.rejectionReason ?? ""} placeholder="Technician reject reason, if rejected" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            <textarea name="supervisorRequest" defaultValue={work.supervisorRequest ?? ""} placeholder="Request from supervisor / support needed" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
          </div>
        )}
        {work && (
          <div className="grid gap-3 rounded-lg bg-emerald-50 p-3">
            <p className="text-sm font-black text-emerald-800">Supervisor Verification</p>
            <textarea name="supervisorDecision" defaultValue={work.supervisorDecision ?? ""} placeholder="Approve, reject, reopen or reassign decision notes" className="min-h-20 rounded-lg border border-emerald-100 p-3 outline-none focus:border-lagoon" />
          </div>
        )}
        {work && <div className="grid grid-cols-2 gap-3"><input name="estimatedHours" type="number" defaultValue={work.estimatedHours ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" /><input name="cost" type="number" defaultValue={work.cost ?? ""} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" /></div>}
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Save Work Order"}</button>
      </div>
    </form>
  );
}

function WorkExecutionForm({ work, onSubmit, saving }: { work: any; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">Update Assigned Work</h3>
      <p className="mt-1 text-sm font-bold text-slate-500">{work.woNo} / {work.title}</p>
      <div className="mt-4 grid gap-3">
        <select name="status" defaultValue={work.status} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed - Submit for Supervisor Review</option>
        </select>
        <textarea name="workNotes" defaultValue={work.workNotes ?? ""} placeholder="Work description / notes" className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        <ImageUploadField name="photoUrls" defaultValue={work.photoUrls ?? ""} />
        <textarea name="materialRequest" defaultValue={work.materialRequest ?? ""} placeholder="Parts request for supervisor approval" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        <textarea name="assetsUsed" defaultValue={work.assetsUsed ?? ""} placeholder="Assets requested or used" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        <textarea name="inventoryUsed" defaultValue={work.inventoryUsed ?? ""} placeholder="Parts/inventory used after approval" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Submit Update"}</button>
      </div>
    </form>
  );
}

function Ppm({
  ppms,
  assets,
  workOrders,
  submitPpm,
  updatePpm,
  saving,
}: {
  ppms: any[];
  assets: any[];
  workOrders: any[];
  submitPpm: (formData: FormData) => void;
  updatePpm: (body: Record<string, unknown>) => Promise<void> | void;
  saving: boolean;
}) {
  const [previewPpm, setPreviewPpm] = useState<any | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const filtered = ppms.filter((ppm) => {
    const asset = assets.find((item) => item.tag === ppm.assetTag);
    const haystack = `${ppm.code} ${ppm.name} ${ppm.assetTag} ${ppm.frequency} ${ppm.checklist} ${asset?.assetGroup || ""}`.toLowerCase();
    const queryMatch = !search || haystack.includes(search.toLowerCase());
    const statusMatch = statusFilter === "All" || (statusFilter === "Active" ? ppm.active : !ppm.active);
    return queryMatch && statusMatch;
  });
  const grouped = filtered.reduce((acc: Record<string, any[]>, ppm) => {
    const key = ppm.nextDue ? new Date(ppm.nextDue).toISOString().slice(0, 10) : "Unscheduled";
    acc[key] = [...(acc[key] ?? []), ppm];
    return acc;
  }, {});

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="Preventive Maintenance Planner" icon={CalendarCheck}>
        <ReportButtons type="ppm" label="PPM report" />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setView("list")} className={`h-10 rounded-lg px-4 text-sm font-black ${view === "list" ? "bg-lagoon text-white" : "bg-slate-50 text-slate-600"}`}>List</button>
            <button type="button" onClick={() => setView("calendar")} className={`h-10 rounded-lg px-4 text-sm font-black ${view === "calendar" ? "bg-lagoon text-white" : "bg-slate-50 text-slate-600"}`}>Calendar</button>
          </div>
          <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 lg:max-w-md">
            <Search size={16} className="text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search PMs" className="h-11 w-full text-sm outline-none" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold">
            <option value="All">Status</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
          </select>
        </div>
        {view === "list" ? (
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-[1100px] border-collapse bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">#</th><th className="px-3 py-3">Title</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Frequency</th><th className="px-3 py-3">Next Due</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Asset</th><th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ppm, index) => {
                  const asset = assets.find((item) => item.tag === ppm.assetTag);
                  return (
                    <tr key={ppm.id} onClick={() => setPreviewPpm(ppm)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3 font-black text-slate-500">{index + 1}</td>
                      <td className="px-3 py-3"><p className="font-black">{ppm.name}</p><p className="text-xs font-bold text-slate-500">{ppm.code}</p></td>
                      <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-xs font-black ${ppm.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{ppm.active ? "Planned" : "Paused"}</span></td>
                      <td className="px-3 py-3">{ppm.frequency}</td>
                      <td className="px-3 py-3">{formatDateCell(ppm.nextDue)}</td>
                      <td className="px-3 py-3">{asset?.assetGroup || asset?.category || "-"}</td>
                      <td className="px-3 py-3 text-lagoon">{ppm.assetTag}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={(event) => { event.stopPropagation(); setPreviewPpm(ppm); }} className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white">Preview</button>
                          <button type="button" disabled={saving} onClick={(event) => { event.stopPropagation(); updatePpm({ id: ppm.id, active: !ppm.active }); }} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">{ppm.active ? "Pause" : "Activate"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-black text-lagoon">{date}</p>
                <div className="mt-2 grid gap-2">
                  {items.map((ppm) => (
                    <button key={ppm.id} type="button" onClick={() => setPreviewPpm(ppm)} className="rounded-lg bg-white p-2 text-left text-sm hover:bg-lagoon/10">
                      <p className="font-bold">{ppm.name}</p>
                      <p className="text-slate-500">{ppm.assetTag} / {ppm.frequency}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <ActionForm title="Create PPM" onSubmit={submitPpm} fields={["code", "name", "assetTag", "frequency", "durationHrs", "checklist"]} saving={saving} />
      {previewPpm && (
        <PmPreviewModal
          ppm={previewPpm}
          asset={assets.find((asset) => asset.tag === previewPpm.assetTag)}
          workOrders={workOrders.filter((work) => work.asset?.tag === previewPpm.assetTag || work.assetTag === previewPpm.assetTag)}
          saving={saving}
          onClose={() => setPreviewPpm(null)}
          onUpdate={(body) => {
            setPreviewPpm((current: any) => current ? { ...current, ...body } : current);
            return updatePpm({ id: previewPpm.id, ...body });
          }}
        />
      )}
    </section>
  );
}

function PmPreviewModal({
  ppm,
  asset,
  workOrders,
  saving,
  onClose,
  onUpdate,
}: {
  ppm: any;
  asset?: any;
  workOrders: any[];
  saving: boolean;
  onClose: () => void;
  onUpdate: (body: Record<string, unknown>) => Promise<void> | void;
}) {
  const checklist = checklistItems(ppm.checklist);
  const [tab, setTab] = useState<"comments" | "history">("history");
  const [quickForm, setQuickForm] = useState<"" | "procedure" | "part" | "cost">("");
  const [quickValue, setQuickValue] = useState("");
  const priority = ppm.durationHrs >= 8 ? "CRITICAL" : ppm.durationHrs >= 4 ? "HIGH" : "MEDIUM";
  const historyData = workOrders.slice(0, 8).map((work) => ({
    name: String(formatDateCell(work.createdAt)).slice(0, 10),
    created: 1,
    completed: ["CLOSED", "COMPLETED", "PENDING_SUPERVISOR_REVIEW"].includes(work.status) ? 1 : 0,
  }));

  async function savePpmQuick(kind: "procedure" | "part" | "cost") {
    const value = quickValue.trim();
    if (!value) return;
    const line = kind === "procedure" ? value : `${kind === "part" ? "Part" : "Cost"}: ${value}`;
    await onUpdate({ checklist: [ppm.checklist, line].filter(Boolean).join("\n") });
    setQuickValue("");
    setQuickForm("");
  }

  return (
    <RequestModalShell title={`PM | ${ppm.name}`} onClose={onClose}>
      <div className="grid gap-5">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <button type="button" disabled={saving} onClick={() => onUpdate({ active: true })} className={`rounded-lg border px-3 py-3 text-xs font-black ${ppm.active ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600"}`}>Active</button>
            <button type="button" disabled={saving} onClick={() => onUpdate({ active: true })} className="rounded-lg border border-lime-300 bg-lime-100 px-3 py-3 text-xs font-black text-lime-800">Planned</button>
            <button type="button" disabled={saving} onClick={() => onUpdate({ active: false })} className={`rounded-lg border px-3 py-3 text-xs font-black ${!ppm.active ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600"}`}>Paused</button>
            <button type="button" disabled={saving} onClick={() => onUpdate({ nextDue: new Date().toISOString() })} className="rounded-lg border border-lagoon/30 px-3 py-3 text-xs font-black text-lagoon">Start Now</button>
          </div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-slate-500">{ppm.code} / Next due {formatDateCell(ppm.nextDue)}</p>
            <h3 className="mt-1 text-2xl font-black">{ppm.name}</h3>
            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm font-bold text-slate-600">{ppm.checklist}</p>
          </div>
          <RequestPriorityBadge priority={priority} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <PreviewField label="Starting From" value={formatDateCell(ppm.nextDue)} />
          <PreviewField label="Progression" value={ppm.active ? "Active" : "Paused"} />
          <PreviewField label="Time to Complete" value={`${ppm.durationHrs || 0} hrs`} />
          <PreviewField label="Work Type" value="Preventive" />
          <PreviewField label="Schedule" value={ppm.frequency} />
          <PreviewField label="Asset" value={ppm.assetTag} />
          <PreviewField label="Category" value={asset?.assetGroup || asset?.category} />
          <PreviewField label="Location" value={[asset?.buildingCode, asset?.floor, asset?.room].filter(Boolean).join(" / ")} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-black">Procedures & Checklist</h4>
            <button type="button" onClick={() => setQuickForm(quickForm === "procedure" ? "" : "procedure")} className="rounded-lg border border-lagoon/30 px-3 py-2 text-xs font-black text-lagoon">Add Procedure</button>
          </div>
          {quickForm === "procedure" && (
            <div className="mt-3 flex gap-2">
              <input value={quickValue} onChange={(event) => setQuickValue(event.target.value)} placeholder="Procedure / checklist step" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon" />
              <button type="button" onClick={() => savePpmQuick("procedure")} className="rounded-lg bg-lagoon px-4 text-sm font-black text-white">Save</button>
            </div>
          )}
          <div className="mt-3 grid gap-2">
            {checklist.map((item, index) => (
              <label key={`${item}-${index}`} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <input type="checkbox" className="mt-1" />
                <span>{index + 1}. {item}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1fr]">
          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between"><h4 className="font-black">Parts</h4><button type="button" onClick={() => setQuickForm(quickForm === "part" ? "" : "part")} className="rounded-lg border border-lagoon/30 px-3 py-2 text-xs font-black text-lagoon">Add Part</button></div>
              {quickForm === "part" && (
                <div className="mt-3 flex gap-2">
                  <input value={quickValue} onChange={(event) => setQuickValue(event.target.value)} placeholder="Part name / quantity" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon" />
                  <button type="button" onClick={() => savePpmQuick("part")} className="rounded-lg bg-lagoon px-4 text-sm font-black text-white">Save</button>
                </div>
              )}
              <p className="mt-2 text-sm font-bold text-slate-500">No parts reserved yet.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between"><h4 className="font-black">Other Costs</h4><button type="button" onClick={() => setQuickForm(quickForm === "cost" ? "" : "cost")} className="rounded-lg border border-lagoon/30 px-3 py-2 text-xs font-black text-lagoon">Add Cost</button></div>
              {quickForm === "cost" && (
                <div className="mt-3 flex gap-2">
                  <input value={quickValue} onChange={(event) => setQuickValue(event.target.value)} placeholder="Cost amount / note" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lagoon" />
                  <button type="button" onClick={() => savePpmQuick("cost")} className="rounded-lg bg-lagoon px-4 text-sm font-black text-white">Save</button>
                </div>
              )}
              <p className="mt-2 text-sm font-bold text-slate-500">No cost entries.</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="font-black">Work Order History</h4>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <BarChart data={historyData.length ? historyData : [{ name: "No WO", created: 0, completed: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e6ee" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="created" fill="#06d6a0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" fill="#0b1f3a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex gap-6 border-b border-slate-200 text-sm font-black">
            <button type="button" onClick={() => setTab("comments")} className={`px-2 pb-3 ${tab === "comments" ? "border-b-2 border-lagoon text-lagoon" : "text-slate-500"}`}>PM Comments</button>
            <button type="button" onClick={() => setTab("history")} className={`px-2 pb-3 ${tab === "history" ? "border-b-2 border-lagoon text-lagoon" : "text-slate-500"}`}>History</button>
          </div>
          <div className="mt-4 grid gap-3">
            {tab === "history" && workOrders.length ? workOrders.slice(0, 6).map((work) => (
              <div key={work.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-black">{work.woNo} / {work.title}</p>
                <p className="font-bold text-slate-500">{work.status?.replaceAll("_", " ")} / {formatDateCell(work.updatedAt)}</p>
              </div>
            )) : <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600">{tab === "history" ? "No completed work orders for this PM yet." : "No PM comments yet."}</p>}
          </div>
        </div>
      </div>
    </RequestModalShell>
  );
}

function Inventory({ inventory, submitInventory, saving }: { inventory: any[]; submitInventory: (formData: FormData) => void; saving: boolean }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="MRO Inventory & Stores" icon={Boxes}>
        <ReportButtons type="inventory" label="Inventory report" />
        <div className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
          <DataTable
            rows={inventory}
            columns={[
              ["sku", "SKU"],
              ["name", "Item"],
              ["category", "Category"],
              ["onHand", "On hand"],
              ["reorderPoint", "Reorder"],
              ["vendor", "Vendor"],
            ]}
          />
          <div className="h-72 rounded-lg bg-slate-50 p-3">
            <ResponsiveContainer>
              <BarChart data={inventory.map((item) => ({ name: item.sku?.slice(0, 8), stock: item.onHand, reorder: item.reorderPoint }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e6ee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#0f8b8d" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reorder" fill="#ffd166" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>
      <ActionForm title="Add Stock Item" onSubmit={submitInventory} fields={["sku", "name", "category", "unit", "onHand", "reorderPoint", "unitCost", "vendor", "location"]} saving={saving} />
    </section>
  );
}

function Hse({ inspections, submitInspection, saving }: { inspections: any[]; submitInspection: (formData: FormData) => void; saving: boolean }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="HSE, Compliance & Inspections" icon={ShieldCheck}>
        <ReportButtons type="inspections" label="HSE report" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <DataTable
          rows={inspections}
          columns={[
            ["code", "Code"],
            ["title", "Inspection"],
            ["area", "Area"],
            ["risk", "Risk"],
            ["score", "Score"],
            ["status", "Status"],
          ]}
        />
        <div className="rounded-lg bg-coral/10 p-4">
          <AlertTriangle className="text-coral" />
          <p className="mt-3 font-black">Permit-to-work control</p>
          <p className="mt-2 text-sm text-slate-700">Link high-risk maintenance to RAMS, lockout-tagout, confined space, hot work and audit trails.</p>
        </div>
        </div>
      </Panel>
      <ActionForm title="Record Inspection" onSubmit={submitInspection} fields={["title", "area", "inspector", "risk", "score", "findings"]} saving={saving} />
    </section>
  );
}

function Iot({ alerts, acknowledgeAlert, saving }: { alerts: any[]; acknowledgeAlert: (id: string) => void; saving: boolean }) {
  return (
    <Panel title="BMS, IoT & Energy Intelligence" icon={RadioTower}>
      <ReportButtons type="iot-alerts" label="IoT alerts report" />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DataTable
          rows={alerts}
          columns={[
            ["source", "Source"],
            ["assetTag", "Asset"],
            ["severity", "Severity"],
            ["message", "Message"],
            ["status", "Status"],
          ]}
        />
        <div className="grid gap-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-black">{alert.assetTag}</p>
              <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
              <button disabled={saving || alert.status === "TRIAGED"} onClick={() => acknowledgeAlert(alert.id)} className="mt-3 rounded-lg bg-ink px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">
                {alert.status === "TRIAGED" ? "Acknowledged" : "Acknowledge"}
              </button>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-lagoon/10 p-4">
          <ClipboardCheck className="text-lagoon" />
          <p className="mt-3 font-black">Condition-based maintenance</p>
          <p className="mt-2 text-sm text-slate-700">Convert BMS alarms, meter thresholds and vibration events into prioritized work with asset history.</p>
        </div>
      </div>
    </Panel>
  );
}

function TeamsServices({
  teams,
  services,
  categories,
  departments,
  saving,
  submitTeam,
  submitService,
  submitCategory,
  submitDepartment,
  view,
}: {
  teams: any[];
  services: any[];
  categories: any[];
  departments: any[];
  saving: boolean;
  submitTeam: (formData: FormData) => void;
  submitService: (formData: FormData) => void;
  submitCategory: (formData: FormData) => void;
  submitDepartment: (formData: FormData) => void;
  view: string;
}) {
  const showAll = !["departments", "team-code", "service-teams", "services-catalog"].includes(view);
  const showDepartments = showAll || view === "departments";
  const showTeamCode = showAll || view === "team-code";
  const showServiceTeams = showAll || view === "service-teams";
  const showServices = showAll || view === "services-catalog";

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        {showDepartments && (
          <Panel title="Department Codes" icon={MapPinned}>
            <ReportButtons type="departments" label="Departments report" />
            <DataTable rows={departments} columns={[["code", "Code"], ["name", "Department"], ["siteLocation", "Site"], ["description", "Description"]]} />
          </Panel>
        )}
        {showTeamCode && (
          <Panel title="Team Codes" icon={Users}>
            <ReportButtons type="teams" label="Team codes report" />
            <DataTable rows={teams} columns={[["code", "Team Code"], ["name", "Team Name"], ["departmentName", "Department"], ["departmentCode", "Dept Code"], ["service", "Service"]]} />
          </Panel>
        )}
        {showServiceTeams && (
          <Panel title="Service Teams" icon={Users}>
            <ReportButtons type="teams" label="Service teams report" />
            <DataTable rows={teams} columns={[["code", "Code"], ["name", "Team"], ["companyIdNumber", "Company ID"], ["departmentCode", "Dept"], ["service", "Service"], ["email", "Email"], ["phone", "Phone"]]} />
          </Panel>
        )}
        {showServices && (
          <Panel title="Services Catalog" icon={ClipboardCheck}>
            <ReportButtons type="services" label="Services report" />
            <DataTable rows={services} columns={[["code", "Code"], ["name", "Service"], ["departmentName", "Department"], ["departmentCode", "Dept"], ["teamCode", "Team Code"], ["slaHours", "SLA hrs"]]} />
          </Panel>
        )}
        {showAll && (
          <Panel title="Asset Categories" icon={Boxes}>
            <ReportButtons type="asset-categories" label="Categories report" />
            <DataTable rows={categories} columns={[["code", "Code"], ["name", "Category"], ["type", "Type"], ["defaultLifeYrs", "Life yrs"], ["statutory", "Statutory"]]} />
          </Panel>
        )}
      </div>
      <div className="space-y-5">
        {showDepartments && <ActionForm title="Create Department Code" onSubmit={submitDepartment} fields={["code", "name", "siteLocation", "description"]} saving={saving} />}
        {showTeamCode && <TeamCodeForm departments={departments} onSubmit={submitTeam} saving={saving} />}
        {showServiceTeams && <TeamForm departments={departments} onSubmit={submitTeam} saving={saving} />}
        {showServices && <ServiceForm teams={teams} departments={departments} onSubmit={submitService} saving={saving} />}
        {showAll && <ActionForm title="Add Asset Category" onSubmit={submitCategory} fields={["code", "name", "type", "defaultLifeYrs", "statutory", "description"]} saving={saving} />}
      </div>
    </section>
  );
}

function TeamCodeForm({ departments, onSubmit, saving }: { departments: any[]; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await onSubmit(new FormData(form));
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">Create Team Code</h3>
      <div className="mt-4 grid gap-3">
        <input name="teamName" placeholder="Team name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <select name="departmentCode" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select department code</option>
          {departments.map((department) => (
            <option key={department.id} value={department.code}>{department.code} - {department.name}</option>
          ))}
        </select>
        <input name="departmentName" placeholder="Department name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <input name="teamCode" placeholder="Team code manual entry" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Create Team Code"}</button>
      </div>
    </form>
  );
}

function TeamForm({ departments, onSubmit, saving }: { departments: any[]; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await onSubmit(new FormData(form));
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">Add Service Team</h3>
      <div className="mt-4 grid gap-3">
        <input name="name" placeholder="Name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <input name="companyIdNumber" placeholder="Company ID number" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <select name="departmentCode" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select department code</option>
          {departments.map((department) => (
            <option key={department.id} value={department.code}>{department.code} - {department.name}</option>
          ))}
        </select>
        <input name="service" placeholder="Service" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <input name="email" type="email" placeholder="Email" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <input name="phone" placeholder="Phone number" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Submit"}</button>
      </div>
    </form>
  );
}

function ServiceForm({ teams, departments, onSubmit, saving }: { teams: any[]; departments: any[]; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await onSubmit(new FormData(form));
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">Add Service</h3>
      <div className="mt-4 grid gap-3">
        <input name="departmentName" placeholder="Department name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <select name="departmentCode" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select department code</option>
          {departments.map((department) => (
            <option key={department.id} value={department.code}>{department.code} - {department.name}</option>
          ))}
        </select>
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Submit"}</button>
      </div>
    </form>
  );
}

function Locations({ locations, submitLocation, saving }: { locations: any[]; submitLocation: (formData: FormData) => void; saving: boolean }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Panel title="Location Register" icon={MapPinned}>
        <ReportButtons type="locations" label="Locations report" />
        <DataTable rows={locations} columns={[["code", "Code"], ["site", "Site"], ["zone", "Zone"], ["building", "Building"], ["floor", "Floor"], ["room", "Room"], ["type", "Type"], ["active", "Active"]]} />
      </Panel>
      <ActionForm title="Add Location" onSubmit={submitLocation} fields={["code", "site", "zone", "building", "floor", "room", "type", "description"]} saving={saving} />
    </section>
  );
}

function JobPlans({ jobPlans, services, departments, submitJobPlan, saving }: { jobPlans: any[]; services: any[]; departments: any[]; submitJobPlan: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await submitJobPlan(new FormData(form));
    form.reset();
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Panel title="Job Plans" icon={ClipboardCheck}>
        <ReportButtons type="job-plans" label="Job plans report" />
        <DataTable rows={jobPlans} columns={[["code", "Code"], ["name", "Name"], ["assetType", "Asset Type"], ["departmentCode", "Dept"], ["serviceCode", "Service"], ["estimatedHours", "Hours"], ["priority", "Priority"], ["active", "Active"]]} />
      </Panel>
      <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
        <h3 className="text-xl font-black">Add Job Plan</h3>
        <div className="mt-4 grid gap-3">
          <input name="code" placeholder="Job plan code" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="name" placeholder="Job plan name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="assetType" placeholder="Specific asset type" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <select name="departmentCode" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option value="">Select department</option>
            {departments.map((department) => <option key={department.id} value={department.code}>{department.code} - {department.name}</option>)}
          </select>
          <select name="serviceCode" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option value="">Select service</option>
            {services.map((service) => <option key={service.id} value={service.code}>{service.code} - {service.name}</option>)}
          </select>
          <input name="estimatedHours" type="number" placeholder="Estimated hours" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <select name="priority" defaultValue="MEDIUM" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
          </select>
          <textarea name="steps" placeholder="Job plan steps" className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
          <textarea name="safetyNotes" placeholder="Safety notes" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
          <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Save Job Plan"}</button>
        </div>
      </form>
    </section>
  );
}

function BulkUpload({ saving, onSubmit, initialModule }: { saving: boolean; onSubmit: (formData: FormData) => void; initialModule: string }) {
  const [module, setModule] = useState(initialModule);

  useEffect(() => {
    setModule(initialModule);
  }, [initialModule]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
    event.currentTarget.reset();
    setModule(initialModule);
  }

  return (
    <section className="grid gap-5">
      <Panel title="Bulk Upload Center" icon={Upload}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1 text-sm font-bold text-slate-600">
            Module
            <select name="module" value={module} onChange={(event) => setModule(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
              <option value="assets">Assets</option>
              <option value="categories">Asset Categories</option>
              <option value="inventory">Inventory</option>
              <option value="requests">Service Requests</option>
              <option value="workOrders">Work Orders</option>
              <option value="jobPlans">Job Plans</option>
              <option value="locations">Locations</option>
              <option value="inspections">Inspections</option>
              <option value="teams">Teams</option>
              <option value="services">Services</option>
              <option value="departments">Departments</option>
              <option value="employees">Employees</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-600">
            CSV File
            <input name="file" type="file" accept=".csv,text/csv" className="rounded-lg border border-slate-200 bg-white p-3" />
          </label>
          <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">
            {saving ? "Uploading..." : "Upload CSV"}
          </button>
        </form>
      </Panel>
    </section>
  );
}

function Templates() {
  const templates = [
    ["assets", "Assets", "SITE,ZONE,BLDG,FLOOR,ROOM,Asset Group,ASSET NUMBER,Asset Description,Additional description,Parent Asset,Department,Remarks"],
    ["departments", "Departments", "code,name,siteLocation,description"],
    ["employees", "Employees", "name,email,companyId,nationalityType,departmentCode,siteLocation"],
    ["teams", "Teams", "name,companyIdNumber,departmentCode,service,email,phone"],
    ["services", "Services", "departmentName,departmentCode"],
    ["inventory", "Inventory", "sku,name,category,unit,onHand,reorderPoint,unitCost,vendor,location"],
    ["requests", "Requests", "ticketNo,title,category,requester,channel,priority,status,location,slaHours,description"],
    ["workOrders", "Work Orders", "woNo,title,type,assetType,departmentCode,serviceCode,assignedTeamCode,priority,status,assetTag,dueHours,estimatedHours,cost,jobPlan,safetyNotes"],
    ["jobPlans", "Job Plans", "code,name,assetType,departmentCode,serviceCode,estimatedHours,priority,steps,safetyNotes"],
    ["locations", "Locations", "code,site,zone,building,floor,room,type,description"],
    ["inspections", "Inspections", "code,title,area,inspector,risk,score,status,dueAt,findings"],
  ];

  return (
    <Panel title="Bulk Upload Templates" icon={ClipboardCheck}>
      <div className="grid gap-3 text-sm lg:grid-cols-2">
        {templates.map(([type, title, value]) => (
          <Template key={type} type={type} title={title} value={value} />
        ))}
      </div>
    </Panel>
  );
}

function UsersRoles({
  users,
  teams,
  departments,
  roles,
  permissions,
  rolePermissions,
  submitUser,
  submitRole,
  updateUser,
  deleteUser,
  saveRolePermissions,
  saving,
  setToast,
}: {
  users: any[];
  teams: any[];
  departments: any[];
  roles: any[];
  permissions: any[];
  rolePermissions: any[];
  submitUser: (formData: FormData) => void;
  submitRole: (formData: FormData) => void;
  updateUser: (id: string, formData: FormData) => void;
  deleteUser: (id: string) => void;
  saveRolePermissions: (role: string, permissionCodes: string[]) => void;
  refreshData: () => void;
  saving: boolean;
  setToast: (message: string) => void;
}) {
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [role, setRole] = useState("Admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    rolePermissions.filter((item) => item.role === "Admin").map((item) => item.permission.code),
  );

  function changeRole(nextRole: string) {
    setRole(nextRole);
    setSelectedPermissions(rolePermissions.filter((item) => item.role === nextRole).map((item) => item.permission.code));
  }

  function togglePermission(code: string) {
    setSelectedPermissions((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <Panel title="Users" icon={Users}>
          <ReportButtons type="users" label="Users report" />
          <div className="grid gap-2">
            {users.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="font-black">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.email} / {user.role} / {user.department}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingUser(user)} className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white">Edit</button>
                  <button
                    onClick={() => user.email === "admin@cafm.local" ? setToast("Initial admin user cannot be deleted.") : deleteUser(user.id)}
                    className="rounded-lg bg-coral px-3 py-2 text-xs font-black text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Permissions Matrix" icon={ShieldCheck}>
          <ReportButtons type="permissions" label="Permissions report" />
          <div className="mb-4 flex flex-wrap gap-3">
            <select value={role} onChange={(event) => changeRole(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3">
              {roleOptions(roles).map((item) => <option key={item}>{item}</option>)}
            </select>
            <button onClick={() => saveRolePermissions(role, selectedPermissions)} className="rounded-lg bg-ink px-4 py-2 text-sm font-black text-white">Save Permissions</button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {permissions.map((permission) => (
              <label key={permission.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <input type="checkbox" checked={selectedPermissions.includes(permission.code)} onChange={() => togglePermission(permission.code)} className="mt-1" />
                <span>
                  <span className="block font-black">{permission.name}</span>
                  <span className="block text-slate-500">{permission.module} / {permission.code}</span>
                </span>
              </label>
            ))}
          </div>
        </Panel>
      </div>
      <div className="space-y-5">
        <RoleForm onSubmit={submitRole} saving={saving} />
        <UserForm title="Create User" teams={teams} departments={departments} users={users} roles={roles} onSubmit={submitUser} saving={saving} />
        {editingUser && <UserForm title="Edit User" user={editingUser} teams={teams} departments={departments} users={users} roles={roles} onSubmit={(formData) => updateUser(editingUser.id, formData)} saving={saving} />}
      </div>
    </section>
  );
}

function RoleForm({ onSubmit, saving }: { onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">Create Custom Role</h3>
      <div className="mt-4 grid gap-3">
        <input name="name" placeholder="Role name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <textarea name="description" placeholder="Role purpose and access scope" className="min-h-20 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Create Role"}</button>
      </div>
    </form>
  );
}

function roleOptions(roles: any[]) {
  const defaults = ["Admin", "Department Supervisor", "Supervisor", "Service Team", "Technician", "Helpdesk", "Reception", "Resident", "Requester"];
  return Array.from(new Set([...defaults, ...roles.map((role) => role.name)]));
}

function UserForm({ title, user, teams, departments, users, roles, onSubmit, saving }: { title: string; user?: any; teams: any[]; departments: any[]; users: any[]; roles: any[]; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
    if (!user) event.currentTarget.reset();
  }

  const cls = "h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon";

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-slate-600">User Name<input name="name" defaultValue={user?.name ?? ""} placeholder="Enter your Name" className={cls} /></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Email<input name="email" defaultValue={user?.email ?? ""} type="email" placeholder="Enter Email" className={cls} /></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Phone<input name="phone" defaultValue={user?.phone ?? ""} placeholder="Enter Phone Number" className={cls} /></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Password<input name="password" type="password" placeholder={user ? "New password optional" : "Optional, default Welcome@123"} className={cls} /></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Select User Role<select name="role" defaultValue={user?.role ?? "Service Team"} className={cls}>
          {roleOptions(roles).map((role) => <option key={role}>{role}</option>)}
        </select></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Select Department<select name="department" defaultValue={user?.department ?? ""} className={cls}>
          <option value="">Select Department</option>
          {departments.map((department) => <option key={department.id} value={department.code}>{department.code} - {department.name}</option>)}
        </select></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Select Team
        <select name="teamCode" defaultValue={user?.team?.code ?? ""} className={cls}>
          <option value="">Select Team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.code}>{team.code} - {team.name}</option>
          ))}
        </select></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Supervisor / Assigned User<select name="supervisorEmail" defaultValue={user?.supervisorEmail ?? ""} className={cls}>
          <option value="">Select user</option>
          {users.filter((item) => item.id !== user?.id).map((item) => <option key={item.id} value={item.email}>{item.name} - {item.role}</option>)}
        </select></label>
        <label className="grid gap-1 text-sm font-bold text-slate-600">Status
        <select name="active" defaultValue={String(user?.active ?? true)} className={cls}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select></label>
        <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
          <p className="text-sm font-black text-slate-700">Email Notification</p>
          <div className="mt-3 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input name="notifyWorkOrder" type="checkbox" defaultChecked={user?.notifyWorkOrder ?? false} /> Work Order</label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input name="notifyFacilityBooking" type="checkbox" defaultChecked={user?.notifyFacilityBooking ?? false} /> Facility Booking</label>
          </div>
        </div>
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400 md:col-span-2">{saving ? "Saving..." : "Create Now"}</button>
      </div>
    </form>
  );
}

function HumanResources({ employees, departments, submitEmployee, saving }: { employees: any[]; departments: any[]; submitEmployee: (formData: FormData) => void; saving: boolean }) {
  const [nationality, setNationality] = useState("All");
  const nationalities = ["All", ...Array.from(new Set(employees.map((employee) => employee.nationalityType).filter(Boolean)))];
  const filtered = nationality === "All" ? employees : employees.filter((employee) => employee.nationalityType === nationality);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await submitEmployee(new FormData(form));
    form.reset();
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Panel title="Employees" icon={Users}>
        <ReportButtons type="employees" label="Employees report" />
        <div className="mb-4 flex items-center gap-3">
          <select value={nationality} onChange={(event) => setNationality(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3">
            {nationalities.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <DataTable rows={filtered} columns={[["name", "Name"], ["email", "Email"], ["companyId", "Company ID"], ["nationalityType", "Nationality"], ["departmentCode", "Dept"], ["siteLocation", "Site"]]} />
      </Panel>
      <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
        <h3 className="text-xl font-black">Add Employee</h3>
        <div className="mt-4 grid gap-3">
          <input name="name" placeholder="Name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="email" type="email" placeholder="Email" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="companyId" placeholder="Company ID" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="nationalityType" placeholder="Nationality type" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <select name="departmentCode" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option value="">Select department</option>
            {departments.map((department) => <option key={department.id} value={department.code}>{department.code} - {department.name}</option>)}
          </select>
          <input name="siteLocation" placeholder="Site location" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Save Employee"}</button>
        </div>
      </form>
    </section>
  );
}

function Reports() {
  const [type, setType] = useState("assets");
  const [rows, setRows] = useState<any[]>([]);
  const [kpis, setKpis] = useState<Record<string, unknown> | null>(null);
  const [responseGreaterThan, setResponseGreaterThan] = useState("");
  const [resolutionGreaterThan, setResolutionGreaterThan] = useState("");
  const [slaBreach, setSlaBreach] = useState("");
  const [delayedOnly, setDelayedOnly] = useState(false);

  async function preview(nextType = type) {
    const response = await fetch(reportUrl(nextType, "preview"), { cache: "no-store" });
    const result = await response.json();
    setRows(result.rows ?? []);
    setKpis(result.kpis ?? null);
  }

  useEffect(() => {
    preview(type);
  }, []);

  const columns = rows[0] ? Object.keys(rows[0]).map((key) => [key, key] as [string, string]) : [];
  const exportUrl = (format: string) => reportUrl(type, format);
  function reportUrl(nextType: string, format: string) {
    const params = new URLSearchParams({ type: nextType, format });
    if (nextType === "work-orders") {
      if (responseGreaterThan) params.set("responseGreaterThan", responseGreaterThan);
      if (resolutionGreaterThan) params.set("resolutionGreaterThan", resolutionGreaterThan);
      if (slaBreach) params.set("slaBreach", slaBreach);
      if (delayedOnly) params.set("delayedOnly", "true");
    }
    return `/api/reports?${params.toString()}`;
  }

  return (
    <section className="space-y-5">
      <Panel title="Reports Preview & Download" icon={ClipboardCheck}>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              preview(event.target.value);
            }}
            className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon"
          >
            <option value="assets">Assets</option>
            <option value="work-orders">Work Orders</option>
            <option value="requests">Service Requests</option>
            <option value="inventory">Inventory</option>
            <option value="ppm">PPM</option>
          </select>
          <a className="rounded-lg bg-lagoon px-4 py-3 text-sm font-black text-white" href={exportUrl("csv")}>CSV</a>
          <a className="rounded-lg bg-leaf px-4 py-3 text-sm font-black text-white" href={exportUrl("excel")}>Excel</a>
          <a className="rounded-lg bg-coral px-4 py-3 text-sm font-black text-white" href={exportUrl("pdf")}>PDF</a>
          <button onClick={() => preview(type)} className="rounded-lg bg-ink px-4 py-3 text-sm font-black text-white">Apply Filters</button>
        </div>
        {type === "work-orders" && (
          <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-4">
            <input value={responseGreaterThan} onChange={(event) => setResponseGreaterThan(event.target.value)} placeholder="Response > mins" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input value={resolutionGreaterThan} onChange={(event) => setResolutionGreaterThan(event.target.value)} placeholder="Resolution > mins" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <select value={slaBreach} onChange={(event) => setSlaBreach(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">SLA all</option>
              <option value="yes">SLA Breach</option>
              <option value="no">No SLA Breach</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={delayedOnly} onChange={(event) => setDelayedOnly(event.target.checked)} /> Delayed only</label>
          </div>
        )}
        {kpis && (
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {Object.entries(kpis).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-black uppercase text-slate-500">{key.replaceAll("_", " ")}</p>
                <p className="mt-1 text-lg font-black">{String(value ?? "-")}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <DataTable rows={rows} columns={columns} />
        </div>
      </Panel>
    </section>
  );
}

function AuditLogs({ logs }: { logs: any[] }) {
  return (
    <Panel title="Audit Logs" icon={Activity}>
      <ReportButtons type="audit-logs" label="Audit report" />
      <DataTable
        rows={logs}
        columns={[
          ["createdAt", "Time"],
          ["actorName", "User"],
          ["role", "Role"],
          ["action", "Action"],
          ["entity", "Record Type"],
          ["entityId", "Record ID"],
          ["details", "Details"],
        ]}
      />
    </Panel>
  );
}

function Template({ type, title, value }: { type: string; title: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black">{title}</p>
        <a href={`/api/templates/${type}`} className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white">Download CSV</a>
      </div>
      <code className="mt-2 block break-words text-xs text-slate-600">{value}</code>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-lagoon/10 text-lagoon">
          <Icon size={20} />
        </div>
        <h3 className="text-xl font-black">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DataTable({ rows, columns }: { rows: any[]; columns: [string, string][] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  return (
    <div className="grid gap-3">
      <div className="overflow-auto rounded-lg border border-slate-200 scrollbar-thin">
        <table className="min-w-full border-collapse bg-white text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-3 py-3 font-black">#</th>
              {columns.map(([, label]) => (
                <th key={label} className="whitespace-nowrap px-3 py-3 font-black">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={row.id ?? index} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-3 font-black text-slate-500">{startIndex + index + 1}</td>
                {columns.map(([key]) => (
                  <td key={key} className="max-w-[280px] whitespace-nowrap px-3 py-3">
                    <CellValue value={row[key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={rows.length} />
    </div>
  );
}

function PaginationControls({ page, totalPages, totalItems, onPageChange }: { page: number; totalPages: number; totalItems: number; onPageChange: (page: number) => void }) {
  if (totalItems === 0) return <p className="text-sm font-bold text-slate-500">No entries found.</p>;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
      <p className="text-sm font-bold text-slate-600">
        Page {page} of {totalPages} / {totalItems} entries / {PAGE_SIZE} per page
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onPageChange(item)}
            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-black ${item === page ? "bg-lagoon text-white" : "border border-slate-200 bg-white text-slate-700"}`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: any }) {
  if (value === null || value === undefined) return <span className="text-slate-400">-</span>;
  if (typeof value === "string" && ["CRITICAL", "HIGH", "EXTREME"].includes(value)) return <span className="rounded-lg bg-coral/10 px-2 py-1 font-black text-coral">{value}</span>;
  if (typeof value === "string" && ["COMPLETED", "CLOSED", "ACTIVE"].includes(value)) return <span className="rounded-lg bg-leaf/10 px-2 py-1 font-black text-leaf">{value}</span>;
  if (typeof value === "string" && value.includes("T")) return new Date(value).toLocaleDateString();
  if (typeof value === "object") return value.name ?? value.tag ?? JSON.stringify(value);
  return String(value);
}

function ActionForm({ title, fields, onSubmit, saving }: { title: string; fields: string[]; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await onSubmit(new FormData(form));
    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-white/80 bg-white p-5 shadow-lift"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-sun/50 text-amber-700">
          <PackagePlus size={20} />
        </div>
        <h3 className="text-xl font-black">{title}</h3>
      </div>
      <div className="grid gap-3">
        {fields.map((field) => (
          <label key={field} className="grid gap-1 text-sm font-bold capitalize text-slate-600">
            {field.replace(/([A-Z])/g, " $1")}
            {field === "description" || field === "jobPlan" ? (
              <textarea name={field} className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            ) : field === "warrantyExpiry" ? (
              <input name={field} type="date" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            ) : field === "statutory" ? (
              <select name={field} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : field === "priority" || field === "criticality" ? (
              <select name={field} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            ) : field === "risk" ? (
              <select name={field} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
                <option>LOW</option>
                <option>MODERATE</option>
                <option>HIGH</option>
                <option>EXTREME</option>
              </select>
            ) : (
              <input name={field} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            )}
          </label>
        ))}
        <button disabled={saving} className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400">
          <Plus size={18} />
          {saving ? "Saving..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

