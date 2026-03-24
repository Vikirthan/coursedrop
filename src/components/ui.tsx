"use client";
import React from "react";
import {
  FiFilePlus,
  FiFileText,
  FiImage,
  FiFile,
} from "react-icons/fi";
import {
  BsFiletypePdf,
  BsFiletypePptx,
  BsFiletypePpt,
  BsFiletypeTxt,
  BsFiletypePng,
  BsFiletypeJpg,
} from "react-icons/bs";

const iconMap: Record<string, React.ReactNode> = {
  pdf: <BsFiletypePdf className="text-red-500" size={28} />,
  pptx: <BsFiletypePptx className="text-orange-500" size={28} />,
  ppt: <BsFiletypePpt className="text-orange-500" size={28} />,
  txt: <BsFiletypeTxt className="text-gray-500" size={28} />,
  png: <BsFiletypePng className="text-teal-500" size={28} />,
  jpg: <BsFiletypeJpg className="text-blue-500" size={28} />,
  jpeg: <BsFiletypeJpg className="text-blue-500" size={28} />,
};

export function FileTypeIcon({ ext }: { ext: string }) {
  return <>{iconMap[ext.toLowerCase()] ?? <FiFile size={28} className="text-slate-400" />}</>;
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
      <div className="mb-4 text-5xl opacity-40">
        {icon ?? <FiFileText />}
      </div>
      <p className="text-lg font-semibold">{title}</p>
      {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
    "approved-deleted": "bg-slate-100 text-slate-700 border-slate-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };

  const label = status === "approved-deleted" ? "Approved - Deleted" : status;

  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${
        colors[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "blue",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
}) {
  const bg: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    purple: "from-purple-500 to-violet-600",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
        bg[accent] ?? bg.blue
      } p-5 text-white shadow-lg`}
    >
      <div className="absolute -right-3 -top-3 opacity-20 text-6xl">{icon}</div>
      <p className="text-sm font-medium opacity-90">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}
