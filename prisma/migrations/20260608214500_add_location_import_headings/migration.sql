ALTER TABLE "Location"
ADD COLUMN "parentLocation" TEXT NOT NULL DEFAULT '',
ADD COLUMN "locationClass" TEXT NOT NULL DEFAULT 'Facility Location',
ADD COLUMN "outOfService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "residential" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Location"
SET "parentLocation" = "zone",
    "locationClass" = "type",
    "outOfService" = NOT "active"
WHERE "locationClass" = 'Facility Location';
