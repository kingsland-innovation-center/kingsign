import { withAuth } from "@/lib/withAuth";
import DashboardClient from "./dashboard-client";

function DashboardPage() {
  return <DashboardClient />;
}

export default withAuth(DashboardPage);