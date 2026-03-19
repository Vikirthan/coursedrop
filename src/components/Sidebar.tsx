"use client";
// ============================================================
// CourseDrop — Dashboard Sidebar
// ============================================================

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FiGrid,
  FiUploadCloud,
  FiSend,
  FiLogOut,
  FiUsers,
  FiFileText,
  FiHome,
  FiAlertCircle,
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
  { label: "My Requests", href: "/teacher/requests", icon: <FiSend /> },
  { label: "Report Bug", href: "/report-bug", icon: <FiAlertCircle /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const nav = user?.role === "admin" ? adminNav : teacherNav;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* brand */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white">
          CD
        </div>
        <span className="text-lg font-bold text-slate-800">CourseDrop</span>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* footer */}
      <div className="border-t border-slate-100 px-4 py-4">
        <Link
          href="/"
          className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <FiHome /> Home
        </Link>
        <button
          onClick={logout}
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
