import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runSql(sql) {
  await prisma.$executeRawUnsafe(sql);
}

async function main() {
  await runSql('ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "parentLocation" TEXT NOT NULL DEFAULT \'\';');
  await runSql('ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "locationClass" TEXT NOT NULL DEFAULT \'Facility Location\';');
  await runSql('ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "outOfService" BOOLEAN NOT NULL DEFAULT false;');
  await runSql('ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "residential" BOOLEAN NOT NULL DEFAULT false;');
  await runSql(`
    UPDATE "Location"
    SET "parentLocation" = COALESCE(NULLIF("parentLocation", ''), "zone"),
        "locationClass" = COALESCE(NULLIF("locationClass", ''), "type"),
        "outOfService" = NOT "active"
    WHERE "parentLocation" = ''
       OR "locationClass" = ''
       OR "locationClass" = 'Facility Location';
  `);
  await runSql(`
    DELETE FROM "Location"
    WHERE "code" LIKE 'KAFD-%'
       OR "site" = 'KAFD'
       OR "site" = 'King Abdullah Financial District';
  `);

  const importSql = await fs.readFile("prisma/migrations/20260608220000_import_fbc_locations/migration.sql", "utf8");
  await runSql(importSql);
  console.log("Location schema and FBC location records are ready.");

  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "eqType" TEXT NOT NULL DEFAULT \'ASSET\';');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "organization" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "assetStatusText" TEXT NOT NULL DEFAULT \'INSTALLED\';');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "departmentDesc" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "classCode" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "classDesc" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "categoryDesc" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "gsrc" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "attribute" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "environment" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "pressureBar" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "flowLps" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "supplyVoltageVolt" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "outOfService" BOOLEAN NOT NULL DEFAULT false;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "serviceLife" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "locationCode" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "locationDesc" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "position" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "classOrganization" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "primarySystem" TEXT;');
  await runSql('ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "additionalNote" TEXT;');
  await runSql('CREATE INDEX IF NOT EXISTS "Asset_tag_idx" ON "Asset"("tag");');
  await runSql('CREATE INDEX IF NOT EXISTS "Asset_locationCode_idx" ON "Asset"("locationCode");');
  await runSql('CREATE INDEX IF NOT EXISTS "Asset_classCode_idx" ON "Asset"("classCode");');
  await runSql('CREATE INDEX IF NOT EXISTS "Asset_category_idx" ON "Asset"("category");');
  await runSql('CREATE INDEX IF NOT EXISTS "Asset_assetStatusText_idx" ON "Asset"("assetStatusText");');
  await runSql('CREATE INDEX IF NOT EXISTS "Asset_departmentCode_idx" ON "Asset"("departmentCode");');
  await runSql('CREATE INDEX IF NOT EXISTS "Asset_assignedTeamCode_idx" ON "Asset"("assignedTeamCode");');
  await runSql('CREATE INDEX IF NOT EXISTS "Location_parentLocation_idx" ON "Location"("parentLocation");');
  await runSql('CREATE INDEX IF NOT EXISTS "Location_locationClass_idx" ON "Location"("locationClass");');
  await runSql('CREATE INDEX IF NOT EXISTS "Location_residential_idx" ON "Location"("residential");');
  await runSql(`
    UPDATE "Asset"
    SET "assetStatusText" = CASE WHEN "status" = 'ACTIVE' THEN 'INSTALLED' ELSE "status"::TEXT END,
        "locationCode" = COALESCE(NULLIF("locationCode", ''), "room"),
        "locationDesc" = COALESCE(NULLIF("locationDesc", ''), "room"),
        "classCode" = COALESCE(NULLIF("classCode", ''), "assetGroup"),
        "categoryDesc" = COALESCE(NULLIF("categoryDesc", ''), "category"),
        "primarySystem" = COALESCE(NULLIF("primarySystem", ''), "system"),
        "additionalNote" = COALESCE(NULLIF("additionalNote", ''), "remarks"),
        "outOfService" = "status" IN ('DOWN', 'RETIRED')
    WHERE "locationCode" IS NULL
       OR "assetStatusText" = 'INSTALLED'
       OR "classCode" IS NULL
       OR "categoryDesc" IS NULL
       OR "primarySystem" IS NULL;
  `);
  console.log("Asset import heading columns are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
