import { NextResponse } from "next/server";

const templates: Record<string, string> = {
  assets: "SITE,ZONE,BLDG,FLOOR,ROOM,Asset Group,ASSET NUMBER,Asset Description,Additional description,Parent Asset,Department,Remarks\n",
  departments: "code,name,siteLocation,description\n",
  employees: "name,email,companyId,nationalityType,departmentCode,siteLocation\n",
  teams: "name,companyIdNumber,departmentCode,service,email,phone\n",
  services: "departmentName,departmentCode,teamCode\n",
  inventory: "sku,name,category,unit,onHand,reorderPoint,unitCost,vendor,location\n",
  requests: "ticketNo,title,category,departmentCode,serviceCode,assignedTeamCode,requester,channel,priority,status,location,attachmentUrls,rejectionReason,slaHours,description\n",
  workOrders: "woNo,title,type,assetType,departmentCode,serviceCode,assignedTeamCode,jobPlanCode,priority,status,assetTag,dueHours,estimatedHours,cost,jobPlan,safetyNotes,workNotes,materialRequest,photoUrls,assetsUsed,inventoryUsed,supervisorDecision\n",
  locations: "code,site,zone,building,floor,room,type,description\n",
  jobPlans: "code,name,assetType,departmentCode,serviceCode,estimatedHours,priority,steps,safetyNotes\n",
  inspections: "code,title,area,inspector,risk,score,status,dueAt,findings\n",
};

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const body = templates[type] ?? templates.assets;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}-template.csv"`,
    },
  });
}
