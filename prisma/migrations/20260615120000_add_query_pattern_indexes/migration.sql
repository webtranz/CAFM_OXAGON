CREATE INDEX IF NOT EXISTS "Asset_departmentCode_tag_idx" ON "Asset"("departmentCode", "tag");
CREATE INDEX IF NOT EXISTS "Asset_buildingCode_floor_room_idx" ON "Asset"("buildingCode", "floor", "room");
CREATE INDEX IF NOT EXISTS "Asset_locationCode_idx" ON "Asset"("locationCode");

CREATE INDEX IF NOT EXISTS "WorkOrder_status_dueAt_idx" ON "WorkOrder"("status", "dueAt");
CREATE INDEX IF NOT EXISTS "WorkOrder_departmentCode_dueAt_idx" ON "WorkOrder"("departmentCode", "dueAt");
CREATE INDEX IF NOT EXISTS "WorkOrder_assignedTeamCode_dueAt_idx" ON "WorkOrder"("assignedTeamCode", "dueAt");
CREATE INDEX IF NOT EXISTS "WorkOrder_assignedToId_dueAt_idx" ON "WorkOrder"("assignedToId", "dueAt");

CREATE INDEX IF NOT EXISTS "ServiceRequest_departmentCode_createdAt_idx" ON "ServiceRequest"("departmentCode", "createdAt");
CREATE INDEX IF NOT EXISTS "ServiceRequest_assignedTeamCode_createdAt_idx" ON "ServiceRequest"("assignedTeamCode", "createdAt");
CREATE INDEX IF NOT EXISTS "ServiceRequest_status_createdAt_idx" ON "ServiceRequest"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "HousingBooking_createdAt_idx" ON "HousingBooking"("createdAt");
CREATE INDEX IF NOT EXISTS "HousingBooking_status_createdAt_idx" ON "HousingBooking"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "HousingBooking_departmentCode_createdAt_idx" ON "HousingBooking"("departmentCode", "createdAt");
CREATE INDEX IF NOT EXISTS "HousingBooking_checkIn_idx" ON "HousingBooking"("checkIn");
CREATE INDEX IF NOT EXISTS "HousingBooking_checkOut_idx" ON "HousingBooking"("checkOut");

CREATE INDEX IF NOT EXISTS "HousingInspection_roomId_status_idx" ON "HousingInspection"("roomId", "status");
CREATE INDEX IF NOT EXISTS "HousingInspection_assetId_status_idx" ON "HousingInspection"("assetId", "status");
CREATE INDEX IF NOT EXISTS "HousingInspection_occupantId_status_idx" ON "HousingInspection"("occupantId", "status");
CREATE INDEX IF NOT EXISTS "HousingInspection_status_dueAt_idx" ON "HousingInspection"("status", "dueAt");
CREATE INDEX IF NOT EXISTS "HousingInspection_dueAt_idx" ON "HousingInspection"("dueAt");
CREATE INDEX IF NOT EXISTS "HousingInspection_createdAt_idx" ON "HousingInspection"("createdAt");

CREATE INDEX IF NOT EXISTS "HousingAsset_status_category_idx" ON "HousingAsset"("status", "category");
CREATE INDEX IF NOT EXISTS "HousingAsset_roomId_status_idx" ON "HousingAsset"("roomId", "status");
CREATE INDEX IF NOT EXISTS "HousingAsset_nextPmDue_idx" ON "HousingAsset"("nextPmDue");
CREATE INDEX IF NOT EXISTS "HousingAsset_warrantyExpiry_idx" ON "HousingAsset"("warrantyExpiry");
CREATE INDEX IF NOT EXISTS "HousingAsset_lastInspectionAt_idx" ON "HousingAsset"("lastInspectionAt");
CREATE INDEX IF NOT EXISTS "HousingAsset_purchaseDate_idx" ON "HousingAsset"("purchaseDate");
CREATE INDEX IF NOT EXISTS "HousingAsset_createdAt_idx" ON "HousingAsset"("createdAt");

CREATE INDEX IF NOT EXISTS "HousingInventory_purchaseRequestStatus_createdAt_idx" ON "HousingInventory"("purchaseRequestStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "HousingInventory_lastMovementAt_idx" ON "HousingInventory"("lastMovementAt");
CREATE INDEX IF NOT EXISTS "HousingInventory_createdAt_idx" ON "HousingInventory"("createdAt");

CREATE INDEX IF NOT EXISTS "HousingApproval_status_createdAt_idx" ON "HousingApproval"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "HousingApproval_createdAt_idx" ON "HousingApproval"("createdAt");

CREATE INDEX IF NOT EXISTS "HousingNotification_createdAt_idx" ON "HousingNotification"("createdAt");
CREATE INDEX IF NOT EXISTS "HousingNotification_read_createdAt_idx" ON "HousingNotification"("read", "createdAt");

CREATE INDEX IF NOT EXISTS "HousingHistory_createdAt_idx" ON "HousingHistory"("createdAt");
CREATE INDEX IF NOT EXISTS "HousingHistory_entity_createdAt_idx" ON "HousingHistory"("entity", "createdAt");
CREATE INDEX IF NOT EXISTS "HousingHistory_roomId_createdAt_idx" ON "HousingHistory"("roomId", "createdAt");
CREATE INDEX IF NOT EXISTS "HousingHistory_bookingId_createdAt_idx" ON "HousingHistory"("bookingId", "createdAt");
