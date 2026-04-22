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
  LayoutDashboard,
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
};

const modules = [
  { id: "command", label: "Command", icon: LayoutDashboard },
  { id: "assets", label: "Assets", icon: Building2 },
  { id: "work", label: "Work", icon: Wrench },
  { id: "helpdesk", label: "Helpdesk", icon: TicketCheck },
  { id: "ppm", label: "PPM", icon: CalendarCheck },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "hse", label: "HSE", icon: ShieldCheck },
  { id: "iot", label: "IoT", icon: RadioTower },
  { id: "teams", label: "Teams", icon: Users },
  { id: "bulk", label: "Bulk Upload", icon: Upload },
];

const healthColors = ["#35a852", "#0f8b8d", "#ffd166", "#f45d48"];
const statToneClasses: Record<string, string> = {
  coral: "text-coral",
  leaf: "text-leaf",
  lagoon: "text-lagoon",
  sun: "text-amber-600",
};

export function CafmConsole({ data }: { data: ConsoleData }) {
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
    setToast(response.ok ? `Service request ${result.ticketNo} created and saved.` : result.message ?? "Service request failed.");
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
    setToast(response.ok ? `Work order ${result.woNo} created and saved.` : result.message ?? "Work order failed.");
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
    setToast(response.ok ? `${successLabel} saved.` : result.message ?? "Action failed.");
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
    setToast(result.message ?? (response.ok ? "Bulk upload complete." : "Bulk upload failed."));
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
    setToast(response.ok ? successLabel : result.message ?? "Action failed.");
    if (response.ok) await refreshData();
    setSaving(false);
  }

  async function updateAsset(id: string, formData: FormData) {
    await patchRecord(`/api/assets/${id}`, Object.fromEntries(formData.entries()) as Record<string, string>, "Asset updated by admin.");
  }

  return (
    <main className="min-h-screen p-4 text-ink sm:p-6 lg:p-8">
      <section className="mx-auto grid max-w-[1540px] grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-white/70 bg-white/82 p-4 shadow-lift backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-lagoon text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black">BrightWorks CAFM</h1>
              <p className="text-sm text-slate-500">Enterprise facility command</p>
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

          <nav className="mt-5 grid gap-2">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`flex h-11 items-center gap-3 rounded-lg px-3 text-left font-bold transition ${
                    active === item.id ? "bg-ink text-white shadow-lg" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-lg bg-sun/35 p-3">
            <p className="text-sm font-black">Mobile ready</p>
            <p className="mt-1 text-sm text-slate-700">Technicians can receive jobs, scan assets, issue spares and close checklists from the field.</p>
          </div>
        </aside>

        <section className="space-y-5">
          <header className="rounded-lg border border-white/70 bg-white/86 p-5 shadow-lift backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-lagoon">International level CAFM suite</p>
                <h2 className="mt-1 text-3xl font-black sm:text-4xl">One-stop facility operations system</h2>
                <p className="mt-2 max-w-3xl text-slate-600">
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
          {active === "ppm" && <Ppm />}
          {active === "inventory" && <Inventory inventory={records.inventory} saving={saving} submitInventory={(formData) => postRecord("/api/inventory", formData, "Inventory item")} />}
          {active === "hse" && <Hse inspections={records.inspections} saving={saving} submitInspection={(formData) => postRecord("/api/inspections", formData, "Inspection")} />}
          {active === "iot" && <Iot alerts={records.alerts} saving={saving} acknowledgeAlert={(id) => patchRecord(`/api/iot-alerts/${id}`, {}, "IoT alert acknowledged.")} />}
          {active === "teams" && (
            <TeamsServices
              teams={records.teams}
              services={records.services}
              categories={records.categories}
              saving={saving}
              submitTeam={(formData) => postRecord("/api/teams", formData, "Team")}
              submitService={(formData) => postRecord("/api/services", formData, "Service")}
              submitCategory={(formData) => postRecord("/api/asset-categories", formData, "Asset category")}
            />
          )}
          {active === "bulk" && <BulkUpload saving={saving} onSubmit={bulkUpload} />}
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
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => setSelectedAssetId(asset.id)}
              className={`grid gap-2 rounded-lg border p-4 text-left transition ${selectedAsset?.id === asset.id ? "border-lagoon bg-lagoon/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-black">{asset.tag} | {asset.name}</p>
                  <p className="text-sm text-slate-500">{asset.category} / {asset.system}</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black">{asset.status}</span>
              </div>
              <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                <span>Building: {asset.building?.name ?? "Unassigned"}</span>
                <span>Floor: {asset.floor ?? "-"}</span>
                <span>Room: {asset.room ?? "-"}</span>
                <span>Health: {asset.conditionScore}%</span>
              </div>
            </button>
          ))}
        </div>
      </Panel>
      <div className="space-y-5">
        {selectedAsset && <AssetIdentity asset={selectedAsset} />}
        {selectedAsset && <AssetHistoryPanel asset={selectedAsset} />}
        <ActionForm
          title="Register Asset"
          onSubmit={submitAsset}
          fields={["tag", "name", "category", "system", "criticality", "serialNumber", "manufacturer", "model", "floor", "room", "warrantyExpiry", "contractRef", "documentationUrl", "purchaseCost", "salvageValue", "depreciationRate", "conditionScore"]}
          saving={saving}
        />
        {selectedAsset && (
          <AssetEditForm asset={selectedAsset} saving={saving} onSubmit={(formData) => updateAsset(selectedAsset.id, formData)} />
        )}
      </div>
    </section>
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
      <div className="mt-4 grid gap-3">
        <input name="tag" defaultValue={textValue(asset.tag)} className={fieldClass} required />
        <input name="name" defaultValue={textValue(asset.name)} className={fieldClass} required />
        <input name="category" defaultValue={textValue(asset.category)} className={fieldClass} required />
        <input name="system" defaultValue={textValue(asset.system)} className={fieldClass} required />
        <select name="criticality" defaultValue={asset.criticality} className={fieldClass}>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
        <select name="status" defaultValue={asset.status} className={fieldClass}>
          <option>ACTIVE</option>
          <option>STANDBY</option>
          <option>DOWN</option>
          <option>RETIRED</option>
        </select>
        <input name="serialNumber" defaultValue={textValue(asset.serialNumber)} className={fieldClass} placeholder="Serial number" />
        <input name="manufacturer" defaultValue={textValue(asset.manufacturer)} className={fieldClass} placeholder="Manufacturer" />
        <input name="model" defaultValue={textValue(asset.model)} className={fieldClass} placeholder="Model" />
        <div className="grid grid-cols-2 gap-3">
          <input name="floor" defaultValue={textValue(asset.floor)} className={fieldClass} placeholder="Floor" />
          <input name="room" defaultValue={textValue(asset.room)} className={fieldClass} placeholder="Room" />
        </div>
        <input name="warrantyExpiry" type="date" defaultValue={dateValue(asset.warrantyExpiry)} className={fieldClass} />
        <input name="contractRef" defaultValue={textValue(asset.contractRef)} className={fieldClass} placeholder="Contract reference" />
        <input name="documentationUrl" defaultValue={textValue(asset.documentationUrl)} className={fieldClass} placeholder="Documentation URL" />
        <div className="grid grid-cols-3 gap-3">
          <input name="purchaseCost" type="number" defaultValue={textValue(asset.purchaseCost)} className={fieldClass} placeholder="Cost" />
          <input name="salvageValue" type="number" defaultValue={textValue(asset.salvageValue)} className={fieldClass} placeholder="Salvage" />
          <input name="depreciationRate" type="number" defaultValue={textValue(asset.depreciationRate)} className={fieldClass} placeholder="Dep. %" />
        </div>
        <input name="conditionScore" type="number" min="0" max="100" defaultValue={textValue(asset.conditionScore)} className={fieldClass} />
        <button disabled={saving} className="h-11 rounded-lg bg-coral font-black text-white disabled:bg-slate-400">Save Admin Changes</button>
      </div>
    </form>
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

function Ppm() {
  return (
    <Panel title="Preventive Maintenance Planner" icon={CalendarCheck}>
      <div className="grid gap-4 lg:grid-cols-3">
        {["HVAC statutory PPM", "Fire systems weekly test", "Generator monthly load run", "Elevator safety service", "Water hygiene flushing", "UPS battery inspection"].map((item, index) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-black">{item}</p>
            <p className="mt-2 text-sm text-slate-600">Frequency: {index % 2 === 0 ? "Monthly" : "Weekly"}</p>
            <p className="mt-1 text-sm text-slate-600">Auto-generates work orders, checklists, safety notes and material reservations.</p>
          </div>
        ))}
      </div>
    </Panel>
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
  saving,
  submitTeam,
  submitService,
  submitCategory,
}: {
  teams: any[];
  services: any[];
  categories: any[];
  saving: boolean;
  submitTeam: (formData: FormData) => void;
  submitService: (formData: FormData) => void;
  submitCategory: (formData: FormData) => void;
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
      </div>
      <div className="space-y-5">
        <ActionForm title="Add Service Team" onSubmit={submitTeam} fields={["code", "name", "type", "supervisor", "phone", "email", "shift", "coverage"]} saving={saving} />
        <ActionForm title="Add Service" onSubmit={submitService} fields={["code", "name", "category", "type", "priority", "slaHours", "teamCode", "description"]} saving={saving} />
        <ActionForm title="Add Asset Category" onSubmit={submitCategory} fields={["code", "name", "type", "defaultLifeYrs", "statutory", "description"]} saving={saving} />
      </div>
    </section>
  );
}

function BulkUpload({ saving, onSubmit }: { saving: boolean; onSubmit: (formData: FormData) => void }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(new FormData(event.currentTarget));
    event.currentTarget.reset();
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
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
      <Panel title="CSV Templates" icon={ClipboardCheck}>
        <div className="grid gap-3 text-sm">
          <Template title="Assets" value="tag,name,category,system,criticality,status,serialNumber,manufacturer,model,floor,room,warrantyExpiry,contractRef,documentationUrl,purchaseCost,salvageValue,depreciationRate,conditionScore" />
          <Template title="Teams" value="code,name,type,supervisor,phone,email,shift,coverage" />
          <Template title="Services" value="code,name,category,type,priority,slaHours,teamCode,description" />
          <Template title="Inventory" value="sku,name,category,unit,onHand,reorderPoint,unitCost,vendor,location" />
          <Template title="Requests" value="ticketNo,title,category,requester,channel,priority,status,location,slaHours,description" />
          <Template title="Work Orders" value="woNo,title,type,priority,status,assetTag,dueHours,estimatedHours,cost,jobPlan,safetyNotes" />
        </div>
      </Panel>
    </section>
  );
}

function Template({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="font-black">{title}</p>
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
