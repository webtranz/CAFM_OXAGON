import { getOperatingData } from "@/lib/data";
import { CafmConsole } from "@/components/cafm-console";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getOperatingData();
  const serialized = JSON.parse(JSON.stringify(data));
  return <CafmConsole data={serialized} user={user} />;
}
