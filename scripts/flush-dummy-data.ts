import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const preservedUserEmails = ["abutt@al-tamimi.com", "admin@cafm.local"];

async function assertPreservedUsersExist() {
  const users = await prisma.user.findMany({
    where: { email: { in: preservedUserEmails } },
    select: { email: true },
  });
  const existingEmails = new Set(users.map((user) => user.email));
  const missingEmails = preservedUserEmails.filter((email) => !existingEmails.has(email));

  if (missingEmails.length > 0) {
    throw new Error(`Flush aborted. Missing preserved login user(s): ${missingEmails.join(", ")}`);
  }
}

async function flushDummyData() {
  await assertPreservedUsersExist();

  await prisma.$transaction([
    prisma.housingHistory.deleteMany({}),
    prisma.housingNotification.deleteMany({}),
    prisma.housingApproval.deleteMany({}),
    prisma.housingInventory.deleteMany({}),
    prisma.housingAsset.deleteMany({}),
    prisma.housingInspection.deleteMany({}),
    prisma.housingBooking.deleteMany({}),
    prisma.housingResident.deleteMany({}),
    prisma.housingBed.deleteMany({}),
    prisma.housingRoom.deleteMany({}),
    prisma.housingBlock.deleteMany({}),
    prisma.housingProperty.deleteMany({}),
    prisma.housingNotificationSetting.deleteMany({}),
    prisma.inventoryIssue.deleteMany({}),
    prisma.meter.deleteMany({}),
    prisma.iotAlert.deleteMany({}),
    prisma.hseIncident.deleteMany({}),
    prisma.inspection.deleteMany({}),
    prisma.complianceCertificate.deleteMany({}),
    prisma.preventiveMaintenance.deleteMany({}),
    prisma.workOrder.deleteMany({}),
    prisma.serviceRequest.deleteMany({}),
    prisma.assetHistory.deleteMany({}),
    prisma.asset.deleteMany({}),
    prisma.documentUpload.deleteMany({}),
    prisma.space.deleteMany({}),
    prisma.building.deleteMany({}),
    prisma.site.deleteMany({}),
    prisma.location.deleteMany({}),
    prisma.jobPlan.deleteMany({}),
    prisma.inventoryItem.deleteMany({}),
    prisma.contract.deleteMany({}),
    prisma.vendor.deleteMany({}),
    prisma.serviceCatalog.deleteMany({}),
    prisma.assetCategory.deleteMany({}),
    prisma.employee.deleteMany({}),
    prisma.department.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.user.updateMany({
      where: { email: { in: preservedUserEmails } },
      data: { teamId: null, active: true },
    }),
    prisma.user.deleteMany({
      where: { email: { notIn: preservedUserEmails } },
    }),
    prisma.team.deleteMany({}),
  ]);
}

async function main() {
  if (process.env.CONFIRM_FLUSH_DUMMY_DATA !== "yes") {
    throw new Error("Set CONFIRM_FLUSH_DUMMY_DATA=yes to flush dummy data.");
  }

  await flushDummyData();

  const remainingUsers = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { email: true, name: true, role: true, active: true },
  });

  console.log("Dummy data flushed.");
  console.log("Preserved login users are active. Existing passwords were not changed.");
  console.table(remainingUsers);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
