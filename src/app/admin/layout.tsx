// ============================================================
// CourseDrop — Admin Layout (with sidebar)
// ============================================================

import Sidebar from "@/components/Sidebar";
import { getSessionUserFromCookies } from "@/lib/apiAuth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUserFromCookies();
  if (!user || user.role !== "admin") {
    redirect("/login/admin");
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
