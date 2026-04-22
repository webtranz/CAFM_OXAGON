"use client";

import { useMemo, useState } from "react";
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
];

const healthColors = ["#35a852", "#0f8b8d", "#ffd166", "#f45d48"];
const statToneClasses: Record<string, string> = {
  coral: "text-coral",
  leaf: "text-leaf",
  lagoon: "text-lagoon",
  sun: "text-amber-600",
};

export function CafmConsole({ data }: { data: ConsoleData }) {
  const [active, setActive] = useState("command");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const filteredAssets = useMemo(() => {
    return data.assets.filter((asset) => `${asset.tag} ${asset.name} ${asset.category}`.toLowerCase().includes(query.toLowerCase()));
  }, [data.assets, query]);

  async function submitRequest(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setToast(response.ok ? "Service request created and routed to helpdesk." : "Connect PostgreSQL to persist new records.");
  }

  async function submitWorkOrder(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setToast(response.ok ? "Work order generated with SLA and job plan." : "Connect PostgreSQL to persist new records.");
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
              {data.live ? "Database online" : "Demo mode"}
            </div>
            <p className="mt-1 text-emerald-900/70">Portfolio cockpit, helpdesk, maintenance, safety, inventory and IoT in one operating layer.</p>
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
                <button className="flex h-11 items-center gap-2 rounded-lg bg-coral px-4 font-black text-white shadow-lg">
                  <Plus size={18} />
                  New Work
                </button>
                <button className="flex h-11 items-center gap-2 rounded-lg bg-lagoon px-4 font-black text-white shadow-lg">
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

          {active === "command" && <CommandCenter data={data} />}
          {active === "assets" && <Assets assets={filteredAssets} query={query} setQuery={setQuery} />}
          {active === "work" && <WorkOrders data={data} submitWorkOrder={submitWorkOrder} />}
          {active === "helpdesk" && <Helpdesk requests={data.requests} submitRequest={submitRequest} />}
          {active === "ppm" && <Ppm />}
          {active === "inventory" && <Inventory inventory={data.inventory} />}
          {active === "hse" && <Hse inspections={data.inspections} />}
          {active === "iot" && <Iot alerts={data.alerts} />}
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

function Assets({ assets, query, setQuery }: { assets: any[]; query: string; setQuery: (value: string) => void }) {
  return (
    <Panel title="Enterprise Asset Register" icon={Building2}>
      <div className="mb-4 flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
        <Search size={18} className="text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tag, asset, category or system" className="w-full outline-none" />
      </div>
      <DataTable
        rows={assets}
        columns={[
          ["tag", "Tag"],
          ["name", "Asset"],
          ["category", "Category"],
          ["system", "System"],
          ["criticality", "Criticality"],
          ["status", "Status"],
          ["conditionScore", "Health"],
        ]}
      />
    </Panel>
  );
}

function WorkOrders({ data, submitWorkOrder }: { data: ConsoleData; submitWorkOrder: (formData: FormData) => void }) {
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
      </Panel>
      <ActionForm title="Generate Work Order" onSubmit={submitWorkOrder} fields={["title", "type", "priority", "assetTag", "jobPlan"]} />
    </section>
  );
}

function Helpdesk({ requests, submitRequest }: { requests: any[]; submitRequest: (formData: FormData) => void }) {
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
      <ActionForm title="Create Service Request" onSubmit={submitRequest} fields={["title", "category", "requester", "priority", "location", "description"]} />
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

function Inventory({ inventory }: { inventory: any[] }) {
  return (
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
  );
}

function Hse({ inspections }: { inspections: any[] }) {
  return (
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
  );
}

function Iot({ alerts }: { alerts: any[] }) {
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
        <div className="rounded-lg bg-lagoon/10 p-4">
          <ClipboardCheck className="text-lagoon" />
          <p className="mt-3 font-black">Condition-based maintenance</p>
          <p className="mt-2 text-sm text-slate-700">Convert BMS alarms, meter thresholds and vibration events into prioritized work with asset history.</p>
        </div>
      </div>
    </Panel>
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

function ActionForm({ title, fields, onSubmit }: { title: string; fields: string[]; onSubmit: (formData: FormData) => void }) {
  return (
    <form
      action={onSubmit}
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
            ) : field === "priority" ? (
              <select name={field} required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon">
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            ) : (
              <input name={field} required className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-lagoon" />
            )}
          </label>
        ))}
        <button className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 font-black text-white">
          <Plus size={18} />
          Submit
        </button>
      </div>
    </form>
  );
}
