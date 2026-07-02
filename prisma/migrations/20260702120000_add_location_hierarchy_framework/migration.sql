ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "sp" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "block" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "PreventiveMaintenance" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PreventiveMaintenance" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "HousingRoom" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HousingRoom" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "HousingBooking" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HousingBooking" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "HousingInspection" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HousingInspection" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "HousingAsset" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HousingAsset" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

ALTER TABLE "HousingInventory" ADD COLUMN IF NOT EXISTS "combinedLocationCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "HousingInventory" ADD COLUMN IF NOT EXISTS "fullLocationPath" TEXT NOT NULL DEFAULT '';

UPDATE "Location"
SET
  "region" = COALESCE(NULLIF("region", ''), NULLIF("zone", ''), split_part("code", '-', 2)),
  "block" = COALESCE(NULLIF("block", ''), left(COALESCE(NULLIF("building", ''), split_part("code", '-', 3)), 1)),
  "combinedLocationCode" = COALESCE(NULLIF("combinedLocationCode", ''), "code"),
  "fullLocationPath" = COALESCE(
    NULLIF("fullLocationPath", ''),
    concat_ws(' > ',
      NULLIF('Site: ' || "site", 'Site: '),
      NULLIF('SP: ' || "sp", 'SP: '),
      NULLIF('Region: ' || COALESCE(NULLIF("region", ''), NULLIF("zone", '')), 'Region: '),
      NULLIF('Block: ' || COALESCE(NULLIF("block", ''), left("building", 1)), 'Block: '),
      NULLIF('Building: ' || "building", 'Building: '),
      NULLIF('Floor: ' || "floor", 'Floor: '),
      NULLIF('Room: ' || "room", 'Room: ')
    )
  );

UPDATE "Asset" a
SET
  "locationId" = COALESCE(a."locationId", l."id"),
  "combinedLocationCode" = COALESCE(NULLIF(a."combinedLocationCode", ''), concat_ws('-', NULLIF(l."combinedLocationCode", ''), a."tag")),
  "fullLocationPath" = COALESCE(NULLIF(a."fullLocationPath", ''), concat_ws(' > ', NULLIF(l."fullLocationPath", ''), NULLIF('Asset: ' || a."tag", 'Asset: ')))
FROM "Location" l
WHERE a."locationCode" = l."code";

UPDATE "ServiceRequest" sr
SET
  "locationId" = COALESCE(sr."locationId", l."id"),
  "combinedLocationCode" = COALESCE(NULLIF(sr."combinedLocationCode", ''), l."combinedLocationCode"),
  "fullLocationPath" = COALESCE(NULLIF(sr."fullLocationPath", ''), l."fullLocationPath")
FROM "Location" l
WHERE sr."location" = l."code";

UPDATE "WorkOrder" wo
SET
  "locationId" = COALESCE(wo."locationId", a."locationId"),
  "combinedLocationCode" = COALESCE(NULLIF(wo."combinedLocationCode", ''), a."combinedLocationCode"),
  "fullLocationPath" = COALESCE(NULLIF(wo."fullLocationPath", ''), a."fullLocationPath")
FROM "Asset" a
WHERE wo."assetId" = a."id";

UPDATE "PreventiveMaintenance" ppm
SET
  "combinedLocationCode" = COALESCE(NULLIF(ppm."combinedLocationCode", ''), l."combinedLocationCode"),
  "fullLocationPath" = COALESCE(NULLIF(ppm."fullLocationPath", ''), l."fullLocationPath")
FROM "Location" l
WHERE ppm."locationCode" = l."code";

CREATE INDEX IF NOT EXISTS "Location_hierarchy_idx" ON "Location"("site", "sp", "region", "block", "building", "floor", "room");
CREATE INDEX IF NOT EXISTS "Location_combinedLocationCode_idx" ON "Location"("combinedLocationCode");
CREATE INDEX IF NOT EXISTS "Asset_combinedLocationCode_idx" ON "Asset"("combinedLocationCode");
CREATE INDEX IF NOT EXISTS "Asset_locationId_idx" ON "Asset"("locationId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_combinedLocationCode_idx" ON "ServiceRequest"("combinedLocationCode");
CREATE INDEX IF NOT EXISTS "ServiceRequest_locationId_idx" ON "ServiceRequest"("locationId");
CREATE INDEX IF NOT EXISTS "WorkOrder_combinedLocationCode_idx" ON "WorkOrder"("combinedLocationCode");
CREATE INDEX IF NOT EXISTS "WorkOrder_locationId_idx" ON "WorkOrder"("locationId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Asset_locationId_fkey') THEN
    ALTER TABLE "Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceRequest_locationId_fkey') THEN
    ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOrder_locationId_fkey') THEN
    ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
