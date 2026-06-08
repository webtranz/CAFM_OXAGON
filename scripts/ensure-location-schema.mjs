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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
