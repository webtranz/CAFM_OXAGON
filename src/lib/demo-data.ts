export const moduleStats = [
  { label: "Open Work Orders", value: "428", delta: "+18 today", tone: "coral" },
  { label: "SLA Compliance", value: "94.7%", delta: "+3.2% vs last month", tone: "leaf" },
  { label: "Critical Assets Online", value: "98.9%", delta: "7 assets at risk", tone: "lagoon" },
  { label: "Inventory Value", value: "$2.8M", delta: "16 low-stock SKUs", tone: "sun" },
];

export const chartData = [
  { name: "Jan", ppm: 420, reactive: 180, inspections: 112 },
  { name: "Feb", ppm: 470, reactive: 154, inspections: 140 },
  { name: "Mar", ppm: 510, reactive: 132, inspections: 156 },
  { name: "Apr", ppm: 548, reactive: 121, inspections: 169 },
  { name: "May", ppm: 590, reactive: 118, inspections: 182 },
  { name: "Jun", ppm: 626, reactive: 96, inspections: 201 },
];

export const assetHealth = [
  { name: "Excellent", value: 42 },
  { name: "Good", value: 31 },
  { name: "Monitor", value: 18 },
  { name: "Risk", value: 9 },
];

export const fallbackData = {
  sites: [
    { id: "demo-site", name: "King Abdullah Financial District", city: "Riyadh", country: "Saudi Arabia", type: "Mixed Use", areaSqm: 284000 },
  ],
  assets: [
    { id: "a1", tag: "AHU-RYD-01-004", name: "Air Handling Unit 4", category: "HVAC", system: "Cooling", criticality: "HIGH", status: "ACTIVE", conditionScore: 88 },
    { id: "a2", tag: "GEN-RYD-02-001", name: "Emergency Generator 1", category: "Power", system: "Electrical", criticality: "CRITICAL", status: "STANDBY", conditionScore: 91 },
    { id: "a3", tag: "FLS-RYD-01-221", name: "Fire Pump Controller", category: "Life Safety", system: "Fire", criticality: "CRITICAL", status: "ACTIVE", conditionScore: 76 },
  ],
  requests: [
    { id: "r1", ticketNo: "SR-24001", title: "Lobby temperature above comfort range", category: "HVAC", requester: "Tenant Services", priority: "HIGH", status: "ASSIGNED", location: "Tower A Lobby", dueAt: new Date() },
    { id: "r2", ticketNo: "SR-24002", title: "Water leak near pantry", category: "Plumbing", requester: "Floor Warden", priority: "CRITICAL", status: "IN_PROGRESS", location: "Tower B L18", dueAt: new Date() },
  ],
  workOrders: [
    { id: "w1", woNo: "WO-81024", title: "Replace AHU filters and rebalance", type: "PPM", priority: "HIGH", status: "IN_PROGRESS", dueAt: new Date(), cost: 2200, assignedTo: { name: "Adeel Khan" }, asset: { tag: "AHU-RYD-01-004" } },
    { id: "w2", woNo: "WO-81025", title: "Fire pump weekly test", type: "Inspection", priority: "CRITICAL", status: "ASSIGNED", dueAt: new Date(), cost: 780, assignedTo: { name: "Sara Malik" }, asset: { tag: "FLS-RYD-01-221" } },
  ],
  inventory: [
    { id: "i1", sku: "FLT-24X24-MERV13", name: "MERV 13 Filter", category: "HVAC", onHand: 34, reorderPoint: 50, unit: "pcs", vendor: "Gulf MEP Supplies" },
    { id: "i2", sku: "LED-PNL-60W", name: "LED Panel 60W", category: "Electrical", onHand: 122, reorderPoint: 80, unit: "pcs", vendor: "BrightLine Trading" },
  ],
  inspections: [
    { id: "ins1", code: "INS-FLS-144", title: "Fire life safety weekly audit", area: "All Towers", risk: "HIGH", score: 91, status: "COMPLETED", dueAt: new Date() },
    { id: "ins2", code: "INS-HSE-033", title: "Contractor permit compliance", area: "Basement Plant", risk: "MODERATE", score: 84, status: "IN_PROGRESS", dueAt: new Date() },
  ],
  alerts: [
    { id: "al1", source: "BMS", assetTag: "CHL-RYD-01-002", severity: "HIGH", message: "Chiller vibration exceeds baseline by 18%", status: "TRIAGED", detectedAt: new Date() },
    { id: "al2", source: "Energy Meter", assetTag: "MDB-RYD-03-001", severity: "MEDIUM", message: "Peak demand forecast breach in 48 hours", status: "NEW", detectedAt: new Date() },
  ],
};
