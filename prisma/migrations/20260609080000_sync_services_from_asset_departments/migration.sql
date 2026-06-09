INSERT INTO "ServiceCatalog" (
  "id",
  "code",
  "name",
  "category",
  "type",
  "priority",
  "slaHours",
  "description",
  "active",
  "createdAt"
)
SELECT
  'svc_' || md5("departmentCode"),
  "departmentCode",
  'Department ' || "departmentCode",
  'Department ' || "departmentCode",
  'Asset Department Service',
  'MEDIUM',
  24,
  'Derived from assets with department code ' || "departmentCode",
  true,
  now()
FROM (
  SELECT DISTINCT "departmentCode"
  FROM "Asset"
  WHERE "departmentCode" IS NOT NULL
    AND "departmentCode" <> ''
) asset_departments
ON CONFLICT ("code") DO UPDATE
SET "type" = 'Asset Department Service',
    "description" = CASE
      WHEN "ServiceCatalog"."description" = '' THEN EXCLUDED."description"
      ELSE "ServiceCatalog"."description"
    END;
