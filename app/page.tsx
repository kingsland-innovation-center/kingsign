import { appPath } from "@/lib/utils";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect(appPath.dashboard.root);
}
