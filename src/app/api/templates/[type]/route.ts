import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

const assetTemplateHeader = "TAG,SITE,ZONE,BLDG,FLOOR,ROOM,ASSET GROUP,ASSET NAME,ASSET DESCRIPTION,ADDITIONAL DESCRIPTION,PARENT ASSET,DEPARTMENT,SUB DEP CODE,LOCATION,ARREA ABBRV,MANUFACTURER,MODEL,INSTALLATION DATE,LIFE SPAN(YEARS),WARRANTY PERIOD(YEARS),REGION,CORRECTIVE ACTION,PREVENTIVE ACTION\n";

const templates: Record<string, string> = {
  sites: "name,city,country,type,areaSqm\n",
  buildings: "code,name,site,city,country,floors,areaSqm\n",
  spaces: "code,name,site,city,country,buildingCode,floor,type,capacity,areaSqm,occupancy\n",
  assets: assetTemplateHeader,
  housingAssets: assetTemplateHeader,
  departments: "code,name,siteLocation,description\n",
  employees: "name,email,companyId,nationalityType,departmentCode,siteLocation\n",
  teams: "name,companyIdNumber,departmentCode,service,email,phone\n",
  services: "departmentName,departmentCode\n",
  inventory: "sku,name,category,unit,onHand,reorderPoint,unitCost,vendor,location\n",
  requests: "ticketNo,title,category,departmentCode,serviceCode,assignedTeamCode,requester,channel,priority,status,location,attachmentUrls,rejectionReason,slaHours,description\n",
  workOrders: "woNo,title,type,assetType,departmentCode,serviceCode,assignedTeamCode,jobPlanCode,priority,status,assetTag,plannedStart,dueAt,finishedAt,resolutionAt,dateTimeCreated,estimatedHours,actualHours,cost,jobPlan,safetyNotes,workNotes,materialRequest,photoUrls,assetsUsed,inventoryUsed,supervisorDecision,sourceYear,sourceWorkOrder,sourceServiceRequest,sourceEquipmentLocation,sourceLocation,matchSource\n",
  locations: "code,site,zone,building,floor,room,type,description\n",
  jobPlans: "code,name,assetType,departmentCode,serviceCode,estimatedHours,priority,steps,safetyNotes\n",
  ppm: "code,name,assetTag,locationCode,frequency,nextDue,durationHrs,departmentCode,priority,checklist,active\n",
  omManuals: "category,assetTag,sourcePath,fileName,manualCode,manualTitle,matchField,assetClass,assetCategory,assetPrimarySystem,department\n",
  inspections: "code,title,area,inspector,risk,score,status,dueAt,findings\n",
};

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { error } = await requireUser();
  if (error) return error;
  const { type } = await params;
  const body = templates[type] ?? templates.assets;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}-template.csv"`,
    },
  });
}
