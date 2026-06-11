ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "shiftEligibility" TEXT NOT NULL DEFAULT 'Day & Night',
  ADD COLUMN IF NOT EXISTS "defaultShift" TEXT NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS "serviceTeamCode" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "supervisor" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "workLocationZone" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "maxHoursPerDay" INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "maxConsecutiveDays" INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS "minRestHours" INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Team"
  ADD COLUMN IF NOT EXISTS "shiftEligibility" TEXT NOT NULL DEFAULT 'Day & Night',
  ADD COLUMN IF NOT EXISTS "maxHoursPerDay" INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "maxConsecutiveDays" INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS "minRestHours" INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "ShiftMaster" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shiftType" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "breakDuration" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShiftMaster_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShiftMaster_name_key" ON "ShiftMaster"("name");

CREATE TABLE IF NOT EXISTS "RotationSetup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "appliesTo" TEXT NOT NULL,
  "shiftSequence" TEXT NOT NULL,
  "offDays" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "repeatCycle" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RotationSetup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RotationSetup_name_key" ON "RotationSetup"("name");

CREATE TABLE IF NOT EXISTS "RosterEntry" (
  "id" TEXT NOT NULL,
  "assignmentType" TEXT NOT NULL,
  "employeeId" TEXT,
  "teamId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "shiftId" TEXT NOT NULL,
  "locationZone" TEXT NOT NULL,
  "supervisor" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "source" TEXT NOT NULL DEFAULT 'Manual',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RosterEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RosterEntry_date_idx" ON "RosterEntry"("date");
CREATE INDEX IF NOT EXISTS "RosterEntry_employeeId_date_idx" ON "RosterEntry"("employeeId", "date");
CREATE INDEX IF NOT EXISTS "RosterEntry_teamId_date_idx" ON "RosterEntry"("teamId", "date");

DO $$ BEGIN
  ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "ShiftMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
