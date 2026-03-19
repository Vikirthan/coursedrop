"use client";
// ============================================================
// CourseDrop — Admin Bug Inbox
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiListBugReports, apiUpdateBugReport } from "@/lib/clientDataApi";
import { BugReport, BugReportStatus } from "@/lib/types";
import { SectionHeader, EmptyState } from "@/components/ui";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiRotateCcw,
  FiTool,
} from "react-icons/fi";
import toast from "react-hot-toast";

function statusStyle(status: BugReportStatus): string {
  if (status === "resolved") {
    return "border-emerald-300 bg-emerald-100 text-emerald-800";
  }
  if (status === "triaged") {
    return "border-blue-300 bg-blue-100 text-blue-800";
  }
  return "border-amber-300 bg-amber-100 text-amber-800";
}

export default function AdminBugsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [filter, setFilter] = useState<"all" | BugReportStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = () => {
    setRefreshing(true);
    apiListBugReports(filter === "all" ? undefined : filter)
      .then((next) => setReports(next))
      .catch((err) => {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to load bug reports");
      })
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    refresh();
  }, [filter]);

  const filtered = useMemo(() => reports, [reports]);

  const handleStatusChange = (reportId: string, status: BugReportStatus) => {
    setUpdatingId(reportId);
    apiUpdateBugReport(reportId, status)
      .then(() => {
        refresh();
        toast.success(`Marked as ${status}`);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to update report");
      })
      .finally(() => setUpdatingId(null));
  };

  return (
    <div>
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
      >
        <FiArrowLeft /> Back to Dashboard
      </Link>

      <SectionHeader
        title="Bug Reports"
        action={
          <div className="flex items-center gap-2">
            {(["all", "open", "triaged", "resolved"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {value}
              </button>
            ))}
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FiAlertCircle />}
          title="No bug reports"
          subtitle="Reported issues will appear here for triage and resolution."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {report.reporterName || "Anonymous"}
                    {report.reporterEmail ? ` (${report.reporterEmail})` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    Role: {report.reporterRole} · {new Date(report.createdAt).toLocaleString()}
                    {report.pagePath ? ` · ${report.pagePath}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${statusStyle(
                    report.status
                  )}`}
                >
                  {report.status}
                </span>
              </div>

              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {report.message}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {report.status !== "triaged" && (
                  <button
                    onClick={() => handleStatusChange(report.id, "triaged")}
                    disabled={updatingId === report.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FiTool /> Mark Triaged
                  </button>
                )}

                {report.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusChange(report.id, "resolved")}
                    disabled={updatingId === report.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <FiCheckCircle /> Mark Resolved
                  </button>
                )}

                {report.status === "resolved" && (
                  <button
                    onClick={() => handleStatusChange(report.id, "open")}
                    disabled={updatingId === report.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <FiRotateCcw /> Reopen
                  </button>
                )}

                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <FiClock /> Updated {new Date(report.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
