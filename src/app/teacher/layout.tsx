// ============================================================
// CourseDrop — Teacher Layout (with sidebar + auth guard)
// ============================================================

import Sidebar from "@/components/Sidebar";
import TeacherTutorialFrame from "@/components/TeacherTutorialFrame";
import { getSessionUserFromCookies } from "@/lib/apiAuth";
import { redirect } from "next/navigation";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUserFromCookies();
  if (!user || user.role !== "teacher") {
    redirect("/login/teacher");
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      <Sidebar />
      <TeacherTutorialFrame userId={user.id}>{children}</TeacherTutorialFrame>
    </div>
  );
}
