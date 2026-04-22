"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  Sparkles,
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
      { id: "ppm", label: "PPM Planner", icon: CalendarCheck },
    ],
  },
  {
    label: "Facility Bookings",
    icon: MapPinned,
    items: [
      { id: "command", label: "Facility Report", icon: Gauge },
      { id: "reports", label: "Bookings Report", icon: ClipboardCheck },
    ],
  },
  {
    label: "Assets Management",
    icon: Building2,
    items: [
      { id: "assets", label: "Assets Management", icon: Building2 },
      { id: "bulk", label: "Bulk Upload Assets", icon: Upload },
      { id: "assets", label: "Asset Inventory Allocation", icon: ClipboardCheck },
    ],
  },
  {
    label: "Inventory Management",
    icon: Boxes,
    items: [
      { id: "inventory", label: "Inventory", icon: Boxes },
      { id: "bulk", label: "Bulk Upload Inventory", icon: Upload },
      { id: "reports", label: "Inventory Reports", icon: ClipboardCheck },
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
      { id: "teams", label: "Department Codes", icon: MapPinned },
      { id: "teams", label: "Create Team Code", icon: Users },
      { id: "teams", label: "Service Teams", icon: Users },
      { id: "teams", label: "Services Catalog", icon: ClipboardCheck },
      { id: "bulk", label: "Bulk Upload Services", icon: Upload },
    ],
  },
  {
    label: "Users Management",
    icon: Users,
    items: [
      { id: "users", label: "Users Management", icon: Users },
      { id: "users", label: "Permissions", icon: ShieldCheck },
    ],
  },
  {
    label: "Utilities",
    icon: Upload,
    items: [
      { id: "bulk", label: "Bulk Upload Center", icon: Upload },
      { id: "templates", label: "Bulk Upload Templates", icon: ClipboardCheck },
      { id: "reports", label: "CSV / Excel / PDF Reports", icon: ClipboardCheck },
    ],
  },
  {
    label: "Activity Logs",
    icon: Activity,
    items: [
      { id: "reports", label: "Reports Preview", icon: ClipboardCheck },
      { id: "command", label: "System Activity", icon: Activity },
    ],
  },
];

const healthColors = ["#35a852", "#0f8b8d", "#ffd166", "#f45d48"];
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

export function CafmConsole({ data, user }: { data: ConsoleData; user: { name: string; email: string; role: string } }) {
  const [records, setRecords] = useState(data);
  const [active, setActive] = useState("command");
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

  async function patchRecord(path: string, body: Record<string, string>, successLabel: string) {
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

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen text-ink">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3 px-1">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-lagoon text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight">BrightWorks CAFM</h1>
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
            {moduleGroups.map((group) => (
              <details key={group.label} open={group.label === "Dashboard" || group.label === "Assets Management"} className="group">
                <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                  <span className="flex items-center gap-3">
                    <group.icon size={18} className="text-slate-600" />
                    {group.label}
                  </span>
                  <ChevronDown size={15} className="text-slate-400 transition group-open:rotate-180" />
                </summary>
                <div className="ml-4 mt-1 grid border-l border-slate-100 pl-3">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={`${group.label}-${item.label}`}
                        onClick={() => setActive(item.id)}
                        className={`flex h-9 items-center gap-2 rounded-lg px-2 text-left text-sm transition ${
                          active === item.id ? "bg-indigo-50 font-black text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                        }`}
                      >
                        <Icon size={13} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </details>
            ))}
          </nav>

          <div className="mt-5 rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-black">{user.name}</p>
            <p className="mt-1 text-xs text-slate-700">{user.role} / {user.email}</p>
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
                  Built for high-volume portfolios: assets, work orders, SLAs, PPM, inspections, inventory, vendors, contracts, HSE, energy and IoT.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActive("work")} className="flex h-11 items-center gap-2 rounded-lg bg-coral px-4 font-black text-white shadow-lg">
                  <Plus size={18} />
                  New Work
                </button>
                <button onClick={() => setActive("helpdesk")} className="flex h-11 items-center gap-2 rounded-lg bg-lagoon px-4 font-black text-white shadow-lg">
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

          {active === "command" && <CommandCenter data={records} />}
          {active === "assets" && (
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
          {active === "work" && <WorkOrders data={records} submitWorkOrder={submitWorkOrder} saving={saving} updateWorkOrder={(id, status) => patchRecord(`/api/work-orders/${id}`, { status }, `Work order marked ${status}.`)} />}
          {active === "helpdesk" && <Helpdesk requests={records.requests} submitRequest={submitRequest} saving={saving} />}
          {active === "ppm" && <Ppm ppms={records.ppms} saving={saving} submitPpm={(formData) => postRecord("/api/ppm", formData, "PPM")} />}
          {active === "inventory" && <Inventory inventory={records.inventory} saving={saving} submitInventory={(formData) => postRecord("/api/inventory", formData, "Inventory item")} />}
          {active === "hse" && <Hse inspections={records.inspections} saving={saving} submitInspection={(formData) => postRecord("/api/inspections", formData, "Inspection")} />}
          {active === "iot" && <Iot alerts={records.alerts} saving={saving} acknowledgeAlert={(id) => patchRecord(`/api/iot-alerts/${id}`, {}, "IoT alert acknowledged.")} />}
          {active === "teams" && (
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
            />
          )}
          {active === "bulk" && <BulkUpload saving={saving} onSubmit={bulkUpload} />}
          {active === "templates" && <Templates />}
          {active === "users" && (
            <UsersRoles
              users={records.users}
              teams={records.teams}
              permissions={records.permissions}
              rolePermissions={records.rolePermissions}
              saving={saving}
              submitUser={(formData) => postRecord("/api/users", formData, "User")}
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
          {active === "reports" && <Reports />}
          {active === "hr" && <HumanResources employees={records.employees} departments={records.departments} saving={saving} submitEmployee={(formData) => postRecord("/api/employees", formData, "Employee")} />}
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

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Panel title="Enterprise Asset Register" icon={Building2}>
        <div className="mb-4 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tag, asset, category or system" className="w-full outline-none" />
        </div>
      <div className="grid gap-3">
          <div className="rounded-lg bg-lagoon/5 p-3 text-sm font-black text-lagoon">
            Showing {assets.length} uploaded / registered assets
          </div>
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => setSelectedAssetId(asset.id)}
              className={`grid gap-2 rounded-lg border p-4 text-left transition ${selectedAsset?.id === asset.id ? "border-lagoon bg-lagoon/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-black">{asset.tag} | {asset.assetDescription ?? asset.name}</p>
                  <p className="text-sm text-slate-500">{asset.assetGroup ?? asset.category} / {asset.system}</p>
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
          <AssetTextField label="SITE" name="siteCode" required />
          <AssetTextField label="ZONE" name="zone" required />
          <AssetTextField label="BLDG" name="buildingCode" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AssetTextField label="FLOOR" name="floor" required />
          <AssetTextField label="ROOM" name="room" required />
        </div>
        <AssetTextField label="Asset Group" name="assetGroup" required />
        <AssetTextField label="ASSET NUMBER" name="tag" required />
        <AssetTextField label="Asset Description" name="assetDescription" required />
        <AssetTextField label="Additional description" name="additionalDescription" />
        <AssetTextField label="Parent Asset" name="parentAsset" />
        <AssetTextField label="Department" name="departmentCode" required />
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
            <EditField label="ASSET NUMBER" name="tag" defaultValue={textValue(asset.tag)} required />
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
            <EditField label="System display name" name="name" defaultValue={textValue(asset.name)} required />
            <EditField label="Category" name="category" defaultValue={textValue(asset.category)} required />
            <EditField label="System" name="system" defaultValue={textValue(asset.system)} required />
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
            <EditField label="Documentation URL" name="documentationUrl" defaultValue={textValue(asset.documentationUrl)} />
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

function WorkOrders({ data, submitWorkOrder, saving, updateWorkOrder }: { data: ConsoleData; submitWorkOrder: (formData: FormData) => void; saving: boolean; updateWorkOrder: (id: string, status: string) => void }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="Work Order Control" icon={Wrench}>
        <DataTable
          rows={data.workOrders}
          columns={[
            ["woNo", "WO"],
            ["title", "Title"],
            ["type", "Type"],
            ["priority", "Priority"],
            ["status", "Status"],
            ["cost", "Cost"],
          ]}
        />
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {data.workOrders.slice(0, 4).map((work) => (
            <div key={work.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-sm font-bold">{work.woNo}</span>
              <div className="flex gap-2">
                <button disabled={saving} onClick={() => updateWorkOrder(work.id, "IN_PROGRESS")} className="rounded-lg bg-lagoon px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Start</button>
                <button disabled={saving} onClick={() => updateWorkOrder(work.id, "COMPLETED")} className="rounded-lg bg-leaf px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Complete</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <ActionForm title="Generate Work Order" onSubmit={submitWorkOrder} fields={["title", "type", "priority", "assetTag", "jobPlan"]} saving={saving} />
    </section>
  );
}

function Helpdesk({ requests, submitRequest, saving }: { requests: any[]; submitRequest: (formData: FormData) => void; saving: boolean }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="Helpdesk & SLA Triage" icon={TicketCheck}>
        <DataTable
          rows={requests}
          columns={[
            ["ticketNo", "Ticket"],
            ["title", "Request"],
            ["category", "Category"],
            ["requester", "Requester"],
            ["priority", "Priority"],
            ["status", "Status"],
            ["location", "Location"],
          ]}
        />
      </Panel>
      <ActionForm title="Create Service Request" onSubmit={submitRequest} fields={["title", "category", "requester", "priority", "location", "description"]} saving={saving} />
    </section>
  );
}

function Ppm({ ppms, submitPpm, saving }: { ppms: any[]; submitPpm: (formData: FormData) => void; saving: boolean }) {
  const grouped = ppms.reduce((acc: Record<string, any[]>, ppm) => {
    const key = ppm.nextDue ? new Date(ppm.nextDue).toISOString().slice(0, 10) : "Unscheduled";
    acc[key] = [...(acc[key] ?? []), ppm];
    return acc;
  }, {});

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="Preventive Maintenance Planner" icon={CalendarCheck}>
        <DataTable rows={ppms} columns={[["code", "Code"], ["name", "PPM"], ["assetTag", "Asset"], ["frequency", "Frequency"], ["nextDue", "Next due"], ["active", "Active"]]} />
        <div className="mt-5">
          <h4 className="font-black">PPM Calendar</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-black text-lagoon">{date}</p>
                <div className="mt-2 grid gap-2">
                  {items.map((ppm) => (
                    <div key={ppm.id} className="rounded-lg bg-white p-2 text-sm">
                      <p className="font-bold">{ppm.name}</p>
                      <p className="text-slate-500">{ppm.assetTag} / {ppm.frequency}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <ActionForm title="Create PPM" onSubmit={submitPpm} fields={["code", "name", "assetTag", "frequency", "durationHrs", "checklist"]} saving={saving} />
    </section>
  );
}

function Inventory({ inventory, submitInventory, saving }: { inventory: any[]; submitInventory: (formData: FormData) => void; saving: boolean }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="MRO Inventory & Stores" icon={Boxes}>
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
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <Panel title="Service Teams" icon={Users}>
          <DataTable rows={teams} columns={[["code", "Code"], ["name", "Team"], ["type", "Type"], ["supervisor", "Supervisor"], ["shift", "Shift"], ["coverage", "Coverage"]]} />
        </Panel>
        <Panel title="Services Catalog" icon={ClipboardCheck}>
          <DataTable rows={services} columns={[["code", "Code"], ["name", "Service"], ["category", "Category"], ["type", "Type"], ["priority", "Priority"], ["slaHours", "SLA hrs"]]} />
        </Panel>
        <Panel title="Asset Categories" icon={Boxes}>
          <DataTable rows={categories} columns={[["code", "Code"], ["name", "Category"], ["type", "Type"], ["defaultLifeYrs", "Life yrs"], ["statutory", "Statutory"]]} />
        </Panel>
        <Panel title="Department Codes" icon={MapPinned}>
          <DataTable rows={departments} columns={[["code", "Code"], ["name", "Department"], ["siteLocation", "Site"], ["description", "Description"]]} />
        </Panel>
      </div>
      <div className="space-y-5">
        <ActionForm title="Create Department Code" onSubmit={submitDepartment} fields={["code", "name", "siteLocation", "description"]} saving={saving} />
        <TeamCodeForm departments={departments} onSubmit={submitTeam} saving={saving} />
        <TeamForm departments={departments} onSubmit={submitTeam} saving={saving} />
        <ServiceForm teams={teams} departments={departments} onSubmit={submitService} saving={saving} />
        <ActionForm title="Add Asset Category" onSubmit={submitCategory} fields={["code", "name", "type", "defaultLifeYrs", "statutory", "description"]} saving={saving} />
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
        <input name="teamName" required placeholder="Team name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <select name="departmentCode" required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select department code</option>
          {departments.map((department) => (
            <option key={department.id} value={department.code}>{department.code} - {department.name}</option>
          ))}
        </select>
        <input name="departmentName" required placeholder="Department name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <input name="teamCode" required placeholder="Team code manual entry" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
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
        <input name="name" required placeholder="Name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <input name="companyIdNumber" required placeholder="Company ID number" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <select name="departmentCode" required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select department code</option>
          {departments.map((department) => (
            <option key={department.id} value={department.code}>{department.code} - {department.name}</option>
          ))}
        </select>
        <input name="service" required placeholder="Service" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
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
        <input name="departmentName" required placeholder="Department name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
        <select name="departmentCode" required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select department code</option>
          {departments.map((department) => (
            <option key={department.id} value={department.code}>{department.code} - {department.name}</option>
          ))}
        </select>
        <select name="teamCode" required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
          <option value="">Select team code</option>
          {teams.map((team) => (
            <option key={team.id} value={team.code}>{team.code} - {team.name}</option>
          ))}
        </select>
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Submit"}</button>
      </div>
    </form>
  );
}

function BulkUpload({ saving, onSubmit }: { saving: boolean; onSubmit: (formData: FormData) => void }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
    event.currentTarget.reset();
  }

  return (
    <section className="grid gap-5">
      <Panel title="Bulk Upload Center" icon={Upload}>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1 text-sm font-bold text-slate-600">
            Module
            <select name="module" required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
              <option value="assets">Assets</option>
              <option value="categories">Asset Categories</option>
              <option value="inventory">Inventory</option>
              <option value="requests">Service Requests</option>
              <option value="workOrders">Work Orders</option>
              <option value="inspections">Inspections</option>
              <option value="teams">Teams</option>
              <option value="services">Services</option>
              <option value="departments">Departments</option>
              <option value="employees">Employees</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-600">
            CSV File
            <input name="file" type="file" accept=".csv,text/csv" required className="rounded-lg border border-slate-200 bg-white p-3" />
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
    ["services", "Services", "departmentName,departmentCode,teamCode"],
    ["inventory", "Inventory", "sku,name,category,unit,onHand,reorderPoint,unitCost,vendor,location"],
    ["requests", "Requests", "ticketNo,title,category,requester,channel,priority,status,location,slaHours,description"],
    ["workOrders", "Work Orders", "woNo,title,type,priority,status,assetTag,dueHours,estimatedHours,cost,jobPlan,safetyNotes"],
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
  permissions,
  rolePermissions,
  submitUser,
  updateUser,
  deleteUser,
  saveRolePermissions,
  saving,
  setToast,
}: {
  users: any[];
  teams: any[];
  permissions: any[];
  rolePermissions: any[];
  submitUser: (formData: FormData) => void;
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
          <div className="mb-4 flex flex-wrap gap-3">
            <select value={role} onChange={(event) => changeRole(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3">
              <option>Admin</option>
              <option>Facility Manager</option>
              <option>Supervisor</option>
              <option>Technician</option>
              <option>Helpdesk</option>
              <option>Viewer</option>
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
        <UserForm title="Create User" teams={teams} onSubmit={submitUser} saving={saving} />
        {editingUser && <UserForm title="Edit User" user={editingUser} teams={teams} onSubmit={(formData) => updateUser(editingUser.id, formData)} saving={saving} />}
      </div>
    </section>
  );
}

function UserForm({ title, user, teams, onSubmit, saving }: { title: string; user?: any; teams: any[]; onSubmit: (formData: FormData) => void; saving: boolean }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
    if (!user) event.currentTarget.reset();
  }

  const cls = "h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon";

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/80 bg-white p-5 shadow-lift">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 grid gap-3">
        <input name="name" defaultValue={user?.name ?? ""} required placeholder="Name" className={cls} />
        <input name="email" defaultValue={user?.email ?? ""} required type="email" placeholder="Email" className={cls} />
        <input name="password" required={!user} type="password" placeholder={user ? "New password optional" : "Password"} className={cls} />
        <select name="role" defaultValue={user?.role ?? "Technician"} required className={cls}>
          <option>Admin</option>
          <option>Facility Manager</option>
          <option>Supervisor</option>
          <option>Technician</option>
          <option>Helpdesk</option>
          <option>Viewer</option>
        </select>
        <input name="department" defaultValue={user?.department ?? ""} required placeholder="Department" className={cls} />
        <select name="teamCode" defaultValue={user?.team?.code ?? ""} className={cls}>
          <option value="">No team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.code}>{team.code} - {team.name}</option>
          ))}
        </select>
        <select name="active" defaultValue={String(user?.active ?? true)} className={cls}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Save"}</button>
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
          <input name="name" required placeholder="Name" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="email" required type="email" placeholder="Email" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="companyId" required placeholder="Company ID" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <input name="nationalityType" required placeholder="Nationality type" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <select name="departmentCode" required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
            <option value="">Select department</option>
            {departments.map((department) => <option key={department.id} value={department.code}>{department.code} - {department.name}</option>)}
          </select>
          <input name="siteLocation" required placeholder="Site location" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
          <button disabled={saving} className="h-11 rounded-lg bg-ink font-black text-white disabled:bg-slate-400">{saving ? "Saving..." : "Save Employee"}</button>
        </div>
      </form>
    </section>
  );
}

function Reports() {
  const [type, setType] = useState("assets");
  const [rows, setRows] = useState<any[]>([]);

  async function preview(nextType = type) {
    const response = await fetch(`/api/reports?type=${nextType}&format=preview`, { cache: "no-store" });
    const result = await response.json();
    setRows(result.rows ?? []);
  }

  useEffect(() => {
    preview(type);
  }, []);

  const columns = rows[0] ? Object.keys(rows[0]).map((key) => [key, key] as [string, string]) : [];

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
          <a className="rounded-lg bg-lagoon px-4 py-3 text-sm font-black text-white" href={`/api/reports?type=${type}&format=csv`}>CSV</a>
          <a className="rounded-lg bg-leaf px-4 py-3 text-sm font-black text-white" href={`/api/reports?type=${type}&format=excel`}>Excel</a>
          <a className="rounded-lg bg-coral px-4 py-3 text-sm font-black text-white" href={`/api/reports?type=${type}&format=pdf`}>PDF</a>
        </div>
        <div className="mt-4">
          <DataTable rows={rows} columns={columns} />
        </div>
      </Panel>
    </section>
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
  return (
    <div className="overflow-auto rounded-lg border border-slate-200 scrollbar-thin">
      <table className="min-w-full border-collapse bg-white text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            {columns.map(([, label]) => (
              <th key={label} className="whitespace-nowrap px-3 py-3 font-black">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index} className="border-t border-slate-100">
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
              <textarea name={field} required className="min-h-24 rounded-lg border border-slate-200 p-3 outline-none focus:border-lagoon" />
            ) : field === "warrantyExpiry" ? (
              <input name={field} type="date" className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            ) : field === "statutory" ? (
              <select name={field} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : field === "priority" || field === "criticality" ? (
              <select name={field} required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            ) : field === "risk" ? (
              <select name={field} required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
                <option>LOW</option>
                <option>MODERATE</option>
                <option>HIGH</option>
                <option>EXTREME</option>
              </select>
            ) : (
              <input name={field} required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
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
