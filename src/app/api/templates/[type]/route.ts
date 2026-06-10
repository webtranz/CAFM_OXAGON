import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

const templates: Record<string, string> = {
  sites: "name,city,country,type,areaSqm\n",
  buildings: "code,name,site,city,country,floors,areaSqm\n",
  spaces: "code,name,site,city,country,buildingCode,floor,type,capacity,areaSqm,occupancy\n",
  assets: "EQUIPMENTNO,EQUIPMENTDESC,ASSETSTATUS,EQTYPE,ORGANIZATION,COMMISSIONDATE,DEPARTMENT,DEPARTMENT_DESC,CLASS,CLASS_DESC,CATEGORY,CATEGORY_DESC,SERIALNUMBER,MODEL,MANUFACTURER,GSRC,ENDOFUSEFULLIFE,ATTRIBUTE,ENVIRONMENT,PRESSURE_BAR,FLOW_LPS,SUPPLY_VOLTAGE_Volt,OUTOFSERVICE,SERVICELIFE,LOCATION,LOCATION_DESC,POSITION,CLASSORGANIZATION,EQUIPMENTVALUE,PRIMARYSYSTEM,ADDITIONAL_NOTE\n",
  departments: "code,name,siteLocation,description\n",
  employees: "name,email,companyId,nationalityType,departmentCode,siteLocation\n",
  teams: "name,companyIdNumber,departmentCode,service,email,phone\n",
  services: "departmentName,departmentCode\n",
  inventory: "sku,name,category,unit,onHand,reorderPoint,unitCost,vendor,location\n",
  requests: "ticketNo,title,category,departmentCode,serviceCode,assignedTeamCode,requester,channel,priority,status,location,attachmentUrls,rejectionReason,slaHours,description\n",
  workOrders: "woNo,title,type,assetType,departmentCode,serviceCode,assignedTeamCode,jobPlanCode,priority,status,assetTag,dueHours,estimatedHours,cost,jobPlan,safetyNotes,workNotes,materialRequest,photoUrls,assetsUsed,inventoryUsed,supervisorDecision\n",
  locations: "code,site,zone,building,floor,room,type,description\n",
  jobPlans: "code,name,assetType,departmentCode,serviceCode,estimatedHours,priority,steps,safetyNotes\n",
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
