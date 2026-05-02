import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { auditAction } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const activeBookingStatuses = ["REQUESTED", "PENDING_APPROVAL", "APPROVED", "CHECKED_IN"];
const bookingApprovalSteps = [
  { step: 1, level: "Housing Coordinator Review", approver: "Housing Coordinator" },
  { step: 2, level: "Housing Supervisor Approval", approver: "Housing Supervisor" },
  { step: 3, level: "Camp Manager Final Approval", approver: "Camp Manager" },
  { step: 4, level: "Reception Allocation", approver: "Reception Team" },
];

const housingSchema = z.object({
  type: z.string(),
  code: z.string().optional(),
  name: z.string().optional(),
  site: z.string().optional(),
  city: z.string().optional(),
  manager: z.string().optional(),
  propertyId: z.string().optional(),
  blockId: z.string().optional(),
  roomId: z.string().optional(),
  bedId: z.string().optional(),
  roomNumber: z.string().optional(),
  floor: z.string().optional(),
  roomType: z.string().optional(),
  genderRestriction: z.string().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  status: z.string().optional(),
  residentId: z.string().optional(),
  residentNo: z.string().optional(),
  residentName: z.string().optional(),
  employeeId: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  contactNumber: z.string().optional(),
  departmentCode: z.string().optional(),
  buildingNumber: z.string().optional(),
  floorNumber: z.string().optional(),
  bedNumber: z.string().optional(),
  bookingType: z.string().optional(),
  allocationType: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  priority: z.string().optional(),
  requestedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  approvalLevel: z.string().optional(),
  attachmentUrls: z.string().optional(),
  notes: z.string().optional(),
  remarks: z.string().optional(),
  keyHandoverBy: z.string().optional(),
  keyHandoverAt: z.string().optional(),
  campIdNumber: z.string().optional(),
  campIdIssuedAt: z.string().optional(),
  cancellationReason: z.string().optional(),
  transferReason: z.string().optional(),
  blacklistReason: z.string().optional(),
  noShowAt: z.string().optional(),
  inspectionType: z.string().optional(),
  inspector: z.string().optional(),
  occupantId: z.string().optional(),
  occupantName: z.string().optional(),
  assetId: z.string().optional(),
  workOrderRef: z.string().optional(),
  furnitureCondition: z.string().optional(),
  mattressCondition: z.string().optional(),
  bedSheetCondition: z.string().optional(),
  tvCondition: z.string().optional(),
  refrigeratorCondition: z.string().optional(),
  acCondition: z.string().optional(),
  waterLeakageCheck: z.string().optional(),
  lightingCondition: z.string().optional(),
  curtainCondition: z.string().optional(),
  doorLockCondition: z.string().optional(),
  smokeDetectorCondition: z.string().optional(),
  fireExtinguisherAvailability: z.string().optional(),
  bathroomCleanliness: z.string().optional(),
  generalRoomCleanliness: z.string().optional(),
  missingAssetVerification: z.string().optional(),
  damageFound: z.coerce.boolean().optional(),
  damageReport: z.string().optional(),
  missingAssetFound: z.coerce.boolean().optional(),
  missingAssetReport: z.string().optional(),
  repairRequired: z.coerce.boolean().optional(),
  estimatedRepairCost: z.coerce.number().optional(),
  occupantLiability: z.string().optional(),
  beforePhotoUrls: z.string().optional(),
  afterPhotoUrls: z.string().optional(),
  maintenanceTicketNo: z.string().optional(),
  createMaintenanceTicket: z.coerce.boolean().optional(),
  score: z.coerce.number().int().min(0).max(100).optional(),
  findings: z.string().optional(),
  photoUrls: z.string().optional(),
  dueAt: z.string().optional(),
  completedAt: z.string().optional(),
  tag: z.string().optional(),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  sku: z.string().optional(),
  onHand: z.coerce.number().int().min(0).optional(),
  reorderPoint: z.coerce.number().int().min(0).optional(),
  unit: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  bookingId: z.string().optional(),
  level: z.string().optional(),
  approver: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  recipient: z.string().optional(),
  severity: z.string().optional(),
});

export async function GET() {
  const [
    properties,
    blocks,
    rooms,
    beds,
    residents,
    bookings,
    inspections,
    assets,
    inventory,
    approvals,
    notifications,
    history,
  ] = await Promise.all([
    prisma.housingProperty.findMany({ orderBy: { name: "asc" } }),
    prisma.housingBlock.findMany({ include: { property: true }, orderBy: { code: "asc" } }),
    prisma.housingRoom.findMany({ include: { property: true, block: true, beds: true }, orderBy: [{ property: { name: "asc" } }, { roomNumber: "asc" }] }),
    prisma.housingBed.findMany({ include: { room: true }, orderBy: { code: "asc" } }),
    prisma.housingResident.findMany({ orderBy: { name: "asc" } }),
    prisma.housingBooking.findMany({ include: { room: { include: { property: true, block: true } }, bed: true, resident: true, approvals: true }, orderBy: { createdAt: "desc" } }),
    prisma.housingInspection.findMany({ include: { room: { include: { property: true, block: true } } }, orderBy: { dueAt: "asc" } }),
    prisma.housingAsset.findMany({ include: { room: { include: { property: true, block: true } } }, orderBy: { tag: "asc" } }),
    prisma.housingInventory.findMany({ include: { room: { include: { property: true, block: true } } }, orderBy: { sku: "asc" } }),
    prisma.housingApproval.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.housingNotification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.housingHistory.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
  ]);

  return NextResponse.json({ properties, blocks, rooms, beds, residents, bookings, inspections, assets, inventory, approvals, notifications, history });
}

export async function POST(request: Request) {
  try {
    const input = housingSchema.parse(await request.json());
    const user = await getCurrentUser();
    const actor = user?.name || user?.email || "System";
    const result = await createHousingRecord(input, actor);
    await auditAction({ user, action: `HOUSING_${input.type.toUpperCase()}_CREATE`, entity: `housing_${input.type}`, entityId: result.id, details: input.name || input.code || input.title });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to save housing record");
  }
}

async function createHousingRecord(input: z.infer<typeof housingSchema>, actor: string) {
  if (input.type === "property") {
    const count = await prisma.housingProperty.count();
    const code = input.code || `HSP-${String(count + 1).padStart(3, "0")}`;
    return prisma.housingProperty.upsert({
      where: { code },
      update: {
        name: input.name || code,
        site: input.site || "Main Housing Site",
        city: input.city || "Jazan",
        manager: input.manager || actor,
        active: input.status !== "INACTIVE",
      },
      create: {
        code,
        name: input.name || code,
        site: input.site || "Main Housing Site",
        city: input.city || "Jazan",
        manager: input.manager || actor,
      },
    });
  }

  if (input.type === "block") {
    const property = await firstProperty(input.propertyId);
    const count = await prisma.housingBlock.count();
    const code = input.code || `HSB-${String(count + 1).padStart(3, "0")}`;
    return prisma.housingBlock.upsert({
      where: { code },
      update: { name: input.name || code, propertyId: property.id },
      create: { code, name: input.name || code, propertyId: property.id, floors: input.capacity || 1 },
    });
  }

  if (input.type === "room") {
    const property = await firstProperty(input.propertyId);
    const block = input.blockId ? await prisma.housingBlock.findUnique({ where: { id: input.blockId } }) : await prisma.housingBlock.findFirst({ where: { propertyId: property.id } });
    const count = await prisma.housingRoom.count();
    const code = input.code || `HSR-${String(count + 1).padStart(4, "0")}`;
    const capacity = input.capacity || 1;
    const room = await prisma.housingRoom.upsert({
      where: { code },
      update: {
        roomNumber: input.roomNumber || code,
        propertyId: property.id,
        blockId: block?.id,
        floor: input.floor || "Ground",
        roomType: input.roomType || "Standard",
        genderRestriction: input.genderRestriction || "MIXED",
        capacity,
        status: input.status === "MAINTENANCE" ? "MAINTENANCE" : "AVAILABLE",
        qrCode: input.code || `QR:${code}`,
        remarks: input.remarks || input.notes || "",
      },
      create: {
        code,
        roomNumber: input.roomNumber || code,
        propertyId: property.id,
        blockId: block?.id,
        floor: input.floor || "Ground",
        roomType: input.roomType || "Standard",
        genderRestriction: input.genderRestriction || "MIXED",
        capacity,
        qrCode: `QR:${code}`,
        remarks: input.remarks || input.notes || "",
      },
    });
    await ensureBeds(room.id, code, capacity);
    await refreshRoomOccupancy(room.id);
    return prisma.housingRoom.findUniqueOrThrow({ where: { id: room.id }, include: { property: true, block: true, beds: true } });
  }

  if (input.type === "resident") {
    const count = await prisma.housingResident.count();
    const residentNo = input.residentNo || `RES-${String(count + 1).padStart(5, "0")}`;
    return prisma.housingResident.upsert({
      where: { residentNo },
      update: residentData(input, residentNo),
      create: residentData(input, residentNo),
    });
  }

  if (input.type === "booking") {
    return createBooking(input, actor);
  }

  if (input.type === "inspection") {
    const room = await firstRoom(input.roomId);
    const checklist = inspectionChecklist(input);
    const count = await prisma.housingInspection.count();
    const inspectionNo = input.code || `HIN-${String(count + 1).padStart(5, "0")}`;
    const inspection = await prisma.housingInspection.create({
      data: {
        inspectionNo,
        roomId: room.id,
        bedId: input.bedId || undefined,
        occupantId: input.occupantId || input.residentId || undefined,
        occupantName: input.occupantName || input.residentName || input.name || "",
        assetId: input.assetId || undefined,
        workOrderRef: input.workOrderRef || "",
        inspector: input.inspector || actor,
        inspectionType: input.inspectionType || input.category || "Room Condition",
        status: (input.status as any) || "SCHEDULED",
        score: input.score ?? 100,
        checklistJson: JSON.stringify(checklist),
        ...checklist,
        damageFound: Boolean(input.damageFound),
        damageReport: input.damageReport || "",
        missingAssetFound: Boolean(input.missingAssetFound),
        missingAssetReport: input.missingAssetReport || "",
        repairRequired: Boolean(input.repairRequired || input.createMaintenanceTicket),
        estimatedRepairCost: input.estimatedRepairCost || 0,
        occupantLiability: input.occupantLiability || "",
        beforePhotoUrls: input.beforePhotoUrls || "",
        afterPhotoUrls: input.afterPhotoUrls || "",
        findings: input.findings || input.notes || "",
        photoUrls: input.photoUrls || input.attachmentUrls || [input.beforePhotoUrls, input.afterPhotoUrls].filter(Boolean).join(","),
        dueAt: input.dueAt ? new Date(input.dueAt) : new Date(),
        completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
      },
    });
    await handleInspectionOutputs(inspection, input, room, actor);
    await housingHistory("inspection", inspection.id, actor, "Inspection created", input.findings || input.notes, { roomId: room.id, inspectionId: inspection.id });
    return prisma.housingInspection.findUniqueOrThrow({ where: { id: inspection.id }, include: { room: { include: { property: true, block: true } } } });
  }

  if (input.type === "asset") {
    const room = input.roomId ? await prisma.housingRoom.findUnique({ where: { id: input.roomId } }) : await prisma.housingRoom.findFirst();
    const count = await prisma.housingAsset.count();
    const tag = input.tag || input.code || `HSA-${String(count + 1).padStart(5, "0")}`;
    const asset = await prisma.housingAsset.upsert({
      where: { tag },
      update: {
        name: input.name || tag,
        category: input.category || "Room Asset",
        roomId: room?.id,
        status: input.status || "ACTIVE",
        serialNumber: input.serialNumber || "",
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
        qrCode: `QR:${tag}`,
        photoUrls: input.photoUrls || input.attachmentUrls || "",
      },
      create: {
        tag,
        name: input.name || tag,
        category: input.category || "Room Asset",
        roomId: room?.id,
        status: input.status || "ACTIVE",
        serialNumber: input.serialNumber || "",
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
        qrCode: `QR:${tag}`,
        photoUrls: input.photoUrls || input.attachmentUrls || "",
      },
    });
    await housingHistory("asset", asset.id, actor, "Housing asset saved", asset.name, { roomId: room?.id, assetId: asset.id });
    return asset;
  }

  if (input.type === "inventory") {
    const room = input.roomId ? await prisma.housingRoom.findUnique({ where: { id: input.roomId } }) : null;
    const count = await prisma.housingInventory.count();
    const sku = input.sku || input.code || `HSI-${String(count + 1).padStart(5, "0")}`;
    const item = await prisma.housingInventory.upsert({
      where: { sku },
      update: inventoryData(input, sku, room?.id),
      create: inventoryData(input, sku, room?.id),
    });
    await housingHistory("inventory", item.id, actor, "Housing inventory saved", item.name, { roomId: room?.id, inventoryId: item.id });
    return item;
  }

  if (input.type === "approval") {
    const approval = await prisma.housingApproval.create({
      data: {
        entity: input.entity || "booking",
        entityId: input.entityId || input.bookingId || "",
        bookingId: input.bookingId,
        level: input.level || input.approvalLevel || "Supervisor",
        approver: input.approver || actor,
        status: (input.status as any) || "PENDING",
        remarks: input.remarks || input.notes || "",
      },
    });
    return approval;
  }

  if (input.type === "notification") {
    return prisma.housingNotification.create({
      data: {
        title: input.title || "Housing Alert",
        message: input.message || input.notes || "Housing notification",
        recipient: input.recipient || actor,
        severity: (input.severity as any) || "MEDIUM",
        bookingId: input.bookingId,
      },
    });
  }

  throw new Error(`Unsupported housing record type: ${input.type}`);
}

function inspectionChecklist(input: z.infer<typeof housingSchema>) {
  return {
    furnitureCondition: input.furnitureCondition || "Good",
    mattressCondition: input.mattressCondition || "Good",
    bedSheetCondition: input.bedSheetCondition || "Good",
    tvCondition: input.tvCondition || "Good",
    refrigeratorCondition: input.refrigeratorCondition || "Good",
    acCondition: input.acCondition || "Good",
    waterLeakageCheck: input.waterLeakageCheck || "No Leak",
    lightingCondition: input.lightingCondition || "Good",
    curtainCondition: input.curtainCondition || "Good",
    doorLockCondition: input.doorLockCondition || "Good",
    smokeDetectorCondition: input.smokeDetectorCondition || "Good",
    fireExtinguisherAvailability: input.fireExtinguisherAvailability || "Available",
    bathroomCleanliness: input.bathroomCleanliness || "Clean",
    generalRoomCleanliness: input.generalRoomCleanliness || "Clean",
    missingAssetVerification: input.missingAssetVerification || "No Missing Asset",
  };
}

async function handleInspectionOutputs(inspection: any, input: z.infer<typeof housingSchema>, room: any, actor: string) {
  if (input.damageFound) {
    await housingHistory("damage", inspection.id, actor, "Damage record created", input.damageReport || input.findings || "", { roomId: room.id, inspectionId: inspection.id });
  }
  if (input.missingAssetFound) {
    if (input.assetId) {
      await prisma.housingAsset.update({ where: { id: input.assetId }, data: { status: "MISSING" } });
      await housingHistory("asset", input.assetId, actor, "Asset marked missing", input.missingAssetReport || input.missingAssetVerification, { roomId: room.id, assetId: input.assetId });
    }
    await housingHistory("missing-asset", inspection.id, actor, "Missing asset report created", input.missingAssetReport || input.missingAssetVerification, { roomId: room.id, inspectionId: inspection.id });
  }
  if (input.repairRequired || input.createMaintenanceTicket) {
    const count = await prisma.serviceRequest.count();
    const request = await prisma.serviceRequest.create({
      data: {
        ticketNo: `SR-${String(count + 24001).padStart(5, "0")}`,
        title: `Housing repair required - ${room.roomNumber}`,
        category: "Housing Maintenance",
        departmentCode: "HOUSING",
        requester: actor,
        channel: "Inspection",
        priority: input.priority as any || "MEDIUM",
        status: "NEW",
        location: `${room.property?.name || "Housing"} / ${room.block?.name || ""} / ${room.roomNumber}`,
        attachmentUrls: [input.beforePhotoUrls, input.afterPhotoUrls, input.photoUrls, input.attachmentUrls].filter(Boolean).join(","),
        slaHours: 24,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        description: [input.damageReport, input.missingAssetReport, input.findings, `Estimated repair cost: ${input.estimatedRepairCost || 0}`, `Occupant liability: ${input.occupantLiability || "-"}`].filter(Boolean).join("\n"),
      },
    });
    await prisma.housingInspection.update({ where: { id: inspection.id }, data: { maintenanceTicketNo: request.ticketNo } });
    await housingHistory("inspection", inspection.id, actor, "Converted to maintenance ticket", request.ticketNo, { roomId: room.id, inspectionId: inspection.id });
  }
}

async function createBooking(input: z.infer<typeof housingSchema>, actor: string) {
  const room = await firstRoom(input.roomId);
  if (["BLOCKED", "MAINTENANCE"].includes(room.status)) {
    throw new Error("Blocked or under-maintenance rooms cannot be allocated.");
  }
  const resident = await resolveResident(input);
  if (resident?.status === "BLACKLISTED") {
    throw new Error("Blacklisted occupants cannot receive a new accommodation allocation.");
  }
  const occupantGender = (input.gender || resident?.gender || "").toUpperCase();
  if (room.genderRestriction && room.genderRestriction !== "MIXED" && occupantGender && occupantGender !== room.genderRestriction.toUpperCase()) {
    throw new Error("Male and female occupants cannot be assigned to this gender-restricted room.");
  }
  const bed = input.bedId ? await prisma.housingBed.findUnique({ where: { id: input.bedId } }) : await prisma.housingBed.findFirst({ where: { roomId: room.id, status: "AVAILABLE" } });
  if (!bed && room.capacity > 1) throw new Error("No available bed found for this room.");
  if (bed && bed.roomId !== room.id) throw new Error("Selected bed does not belong to the selected room.");
  if (bed && ["RESERVED", "OCCUPIED"].includes(bed.status)) throw new Error("Occupied beds cannot be assigned twice.");

  const duplicate = await prisma.housingBooking.findFirst({
    where: {
      status: { in: activeBookingStatuses as any },
      OR: [{ roomId: room.id, bedId: null }, ...(bed ? [{ bedId: bed.id }] : [])],
    },
  });
  if (duplicate && (room.capacity <= 1 || duplicate.bedId === bed?.id)) {
    throw new Error("Duplicate room or bed allocation is not allowed.");
  }

  const count = await prisma.housingBooking.count();
  const bookingNo = input.code || `HBK-${String(count + 1).padStart(5, "0")}`;
  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.housingBooking.create({
      data: {
        bookingNo,
        residentId: resident?.id || input.residentId,
        residentName: input.residentName || input.name || resident?.name || "Resident",
        departmentCode: input.departmentCode || resident?.departmentCode || "",
        employeeId: input.employeeId || input.residentNo || resident?.residentNo || "",
        companyName: input.companyName || resident?.companyName || input.companyId || "",
        nationality: input.nationality || resident?.nationality || "",
        contactNumber: input.contactNumber || input.phone || resident?.phone || "",
        gender: occupantGender || "",
        buildingNumber: input.buildingNumber || room.block?.name || room.property?.name || "",
        floorNumber: input.floorNumber || room.floor,
        roomNumber: input.roomNumber || room.roomNumber,
        bedNumber: input.bedNumber || bed?.label || "",
        bookingType: input.bookingType || "TEMPORARY",
        allocationType: input.allocationType || "STANDARD",
        roomId: room.id,
        bedId: bed?.id,
        checkIn: input.checkIn ? new Date(input.checkIn) : new Date(),
        checkOut: input.checkOut ? new Date(input.checkOut) : undefined,
        status: "PENDING_APPROVAL",
        priority: (input.priority as any) || "MEDIUM",
        requestedBy: input.requestedBy || actor,
        approvedBy: input.approvedBy || "",
        approvalLevel: bookingApprovalSteps[0].level,
        attachmentUrls: input.attachmentUrls || "",
        notes: input.notes || "",
        keyHandoverBy: input.keyHandoverBy || "",
        keyHandoverAt: input.keyHandoverAt ? new Date(input.keyHandoverAt) : undefined,
        campIdNumber: input.campIdNumber || "",
        campIdIssuedAt: input.campIdIssuedAt ? new Date(input.campIdIssuedAt) : undefined,
      },
    });
    await tx.housingApproval.createMany({
      data: bookingApprovalSteps.map((step) => ({
        entity: "booking",
        entityId: created.id,
        bookingId: created.id,
        level: step.level,
        step: step.step,
        approver: step.approver,
        status: step.step === 1 ? "PENDING" : "WAITING",
        remarks: step.step === 1 ? created.notes || "" : "",
      })),
    });
    await tx.housingNotification.create({
      data: {
        title: "Housing booking pending coordinator review",
        message: `${created.bookingNo} for ${created.residentName} is waiting for Housing Coordinator review.`,
        recipient: bookingApprovalSteps[0].approver,
        severity: created.priority,
        bookingId: created.id,
      },
    });
    return created;
  });
  await refreshRoomOccupancy(room.id);
  await housingHistory("booking", booking.id, actor, "Booking created", booking.notes, { roomId: room.id, bookingId: booking.id });
  return booking;
}

async function resolveResident(input: z.infer<typeof housingSchema>) {
  if (input.residentId) return prisma.housingResident.findUnique({ where: { id: input.residentId } });
  const employeeId = input.employeeId || input.residentNo;
  if (!employeeId && !(input.residentName || input.name)) return null;
  const residentNo = employeeId || `RES-${String((await prisma.housingResident.count()) + 1).padStart(5, "0")}`;
  return prisma.housingResident.upsert({
    where: { residentNo },
    update: residentData(input, residentNo),
    create: residentData(input, residentNo),
  });
}

function residentData(input: z.infer<typeof housingSchema>, residentNo: string) {
  return {
    residentNo,
    name: input.name || input.residentName || residentNo,
    email: input.email || "",
    phone: input.phone || "",
    companyId: input.companyId || input.companyName || "",
    companyName: input.companyName || input.companyId || "",
    gender: input.gender || "",
    nationality: input.nationality || "",
    departmentCode: input.departmentCode || "",
    status: input.status || "ACTIVE",
  };
}

function inventoryData(input: z.infer<typeof housingSchema>, sku: string, roomId?: string) {
  return {
    sku,
    name: input.name || sku,
    category: input.category || "Housing Consumable",
    roomId,
    onHand: input.onHand ?? 0,
    reorderPoint: input.reorderPoint ?? 0,
    unit: input.unit || "Each",
    qrCode: `QR:${sku}`,
  };
}

async function firstProperty(propertyId?: string) {
  const property = propertyId ? await prisma.housingProperty.findUnique({ where: { id: propertyId } }) : await prisma.housingProperty.findFirst();
  if (property) return property;
  return prisma.housingProperty.create({ data: { code: "HSP-001", name: "Tamimi Housing Village", site: "Jazan", city: "Jazan", manager: "Housing Supervisor" } });
}

async function firstRoom(roomId?: string) {
  const room = roomId
    ? await prisma.housingRoom.findUnique({ where: { id: roomId }, include: { property: true, block: true } })
    : await prisma.housingRoom.findFirst({ include: { property: true, block: true } });
  if (!room) throw new Error("Create a housing room before using this function.");
  return room;
}

async function ensureBeds(roomId: string, roomCode: string, capacity: number) {
  const existing = await prisma.housingBed.count({ where: { roomId } });
  for (let index = existing + 1; index <= capacity; index += 1) {
    await prisma.housingBed.upsert({
      where: { code: `${roomCode}-B${index}` },
      update: {},
      create: { code: `${roomCode}-B${index}`, label: `Bed ${index}`, roomId },
    });
  }
}

async function refreshRoomOccupancy(roomId: string) {
  const occupancy = await prisma.housingBed.count({ where: { roomId, status: { in: ["RESERVED", "OCCUPIED"] as any } } });
  const room = await prisma.housingRoom.findUnique({ where: { id: roomId } });
  if (!room) return;
  const status = room.status === "MAINTENANCE" || room.status === "BLOCKED" ? room.status : occupancy >= room.capacity ? "OCCUPIED" : occupancy > 0 ? "RESERVED" : "AVAILABLE";
  await prisma.housingRoom.update({ where: { id: roomId }, data: { occupancy, status } });
}

async function housingHistory(entity: string, entityId: string, actor: string, action: string, details?: string | null, links: { roomId?: string; bookingId?: string; inspectionId?: string; assetId?: string; inventoryId?: string } = {}) {
  await prisma.housingHistory.create({
    data: { entity, entityId, actor, action, details: details || "", ...links },
  });
}
