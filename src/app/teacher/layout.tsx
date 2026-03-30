"use client";
// ============================================================
// CourseDrop — Teacher Layout (with sidebar + auth guard)
// ============================================================

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TeacherTutorialFrame from "@/components/TeacherTutorialFrame";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      router.replace("/login/teacher");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      <Sidebar />
      <TeacherTutorialFrame userId={user.id}>{children}</TeacherTutorialFrame>
    </div>
  );
}
