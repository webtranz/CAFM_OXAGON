DELETE FROM "ServiceCatalog"
WHERE "type" = 'Asset Department Service'
   OR "description" LIKE 'Derived from assets with department code %';
