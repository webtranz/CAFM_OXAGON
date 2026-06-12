import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = "admin@cafm.local";
const adminPassword = "Admin@12345";

async function clearSeedData() {
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
  await prisma.housingNotificationSetting.deleteMany({});

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
  await prisma.documentUpload.deleteMany({});
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

  await prisma.rosterEntry.deleteMany({});
  await prisma.rotationSetup.deleteMany({});
  await prisma.shiftMaster.deleteMany({});

  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});

  await prisma.user.updateMany({ data: { teamId: null } });
  await prisma.user.deleteMany({ where: { email: { not: adminEmail } } });
  await prisma.team.deleteMany({});
}

async function main() {
  await clearSeedData();

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "System Administrator",
      role: "Admin",
      department: "Administration",
      passwordHash,
      active: true,
      teamId: null,
    },
    create: {
      name: "System Administrator",
      email: adminEmail,
      role: "Admin",
      department: "Administration",
      passwordHash,
      active: true,
    },
  });

  console.log(`Database seed complete. Admin login: ${adminEmail}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
