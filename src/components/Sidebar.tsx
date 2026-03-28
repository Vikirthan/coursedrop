"use client";
// ============================================================
// CourseDrop — Dashboard Sidebar
// ============================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiListRequests } from "@/lib/clientDataApi";
import {
  FiGrid,
  FiUploadCloud,
  FiSend,
  FiLogOut,
  FiUsers,
  FiFileText,
  FiHome,
  FiAlertCircle,
  FiEye,
} from "react-icons/fi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <FiGrid /> },
  { label: "Requests", href: "/admin/requests", icon: <FiUsers /> },
  { label: "Teachers", href: "/admin/teachers", icon: <FiUsers /> },
  { label: "Materials", href: "/admin/materials", icon: <FiFileText /> },
  { label: "Bug Reports", href: "/admin/bugs", icon: <FiAlertCircle /> },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: <FiGrid /> },
  { label: "Upload", href: "/teacher/upload", icon: <FiUploadCloud /> },
  { label: "Student Preview", href: "/teacher/student-preview", icon: <FiEye /> },
  { label: "My Requests", href: "/teacher/requests", icon: <FiSend /> },
  { label: "Report Bug", href: "/report-bug", icon: <FiAlertCircle /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const nav = user?.role === "admin" ? adminNav : teacherNav;
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [pendingTeacherCount, setPendingTeacherCount] = useState(0);
  const [openBugCount, setOpenBugCount] = useState(0);

  useEffect(() => {
    if (user?.role !== "admin") {
      setPendingRequestCount(0);
      setPendingTeacherCount(0);
      setOpenBugCount(0);
      return;
    }

    let cancelled = false;

    const loadAdminCounts = async () => {
      try {
        const [pendingRequests, teacherRes, bugRes] = await Promise.all([
          apiListRequests({ status: "pending" }),
          fetch(`/api/admin/teachers?_ts=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/data/bugs?_ts=${Date.now()}`, { cache: "no-store" }),
        ]);

        const teacherPayload = (await teacherRes.json().catch(() => ({}))) as {
          teachers?: Array<{ approved?: boolean }>;
        };
        const bugPayload = (await bugRes.json().catch(() => ({}))) as {
          reports?: Array<{ status?: string }>;
        };
        const teachers = teacherPayload.teachers ?? [];
        const reports = bugPayload.reports ?? [];

        if (!cancelled) {
          setPendingRequestCount(pendingRequests.length);
          setPendingTeacherCount(teachers.filter((teacher) => !teacher.approved).length);
          setOpenBugCount(reports.filter((report) => report.status !== "resolved").length);
        }
      } catch {
        if (!cancelled) {
          setPendingRequestCount(0);
          setPendingTeacherCount(0);
          setOpenBugCount(0);
        }
      }
    };

    void loadAdminCounts();

    const intervalId = window.setInterval(() => {
      void loadAdminCounts();
    }, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadAdminCounts();
      }
    };

    window.addEventListener("focus", loadAdminCounts);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadAdminCounts);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.role]);

  const adminBadges: Record<string, number> = {
    "/admin/requests": pendingRequestCount,
    "/admin/teachers": pendingTeacherCount,
    "/admin/bugs": openBugCount,
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:h-screen md:w-64 md:border-b-0 md:border-r">
      {/* brand */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 md:px-6 md:py-5">
        <Image src="/icon.svg" alt="CourseDrop logo" width={40} height={40} className="h-10 w-10 rounded-xl" priority />
        <span className="text-lg font-bold text-slate-800">CourseDrop</span>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-x-auto px-2 py-3 md:space-y-1 md:px-3 md:py-4">
        <div className="flex min-w-max gap-2 md:block md:min-w-0 md:space-y-1 md:gap-0">
        {nav.map((item) => {
          const active = pathname === item.href;
          const badgeCount = user?.role === "admin" ? (adminBadges[item.href] ?? 0) : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all md:gap-3 md:px-4 md:py-2.5 ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span className="flex items-center gap-2.5 md:gap-3">
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </span>
              {badgeCount > 0 && (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
        </div>
      </nav>

      {/* footer */}
      <div className="border-t border-slate-100 px-3 py-3 md:px-4 md:py-4">
        <Link
          href="/"
          className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <FiHome /> Home
        </Link>
        <button
          onClick={() => {
            void logout();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          <FiLogOut /> Sign out
        </button>
        {user && (
          <p className="mt-2 truncate px-3 text-xs text-slate-400">
            Signed in as <span className="font-semibold">{user.name}</span>
          </p>
        )}
      </div>
    </aside>
  );
}
