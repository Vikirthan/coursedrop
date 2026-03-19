"use client";
// ============================================================
// CourseDrop — Admin: Manage Subject Requests
// ============================================================

import React, { useEffect, useState } from "react";
import { getRequests, getDriveFolderId, updateRequestStatus } from "@/lib/store";
import { SubjectRequest } from "@/lib/types";
import { SectionHeader, StatusChip, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { FiCheck, FiX, FiInbox, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refresh = () => setRequests(getRequests());
  useEffect(refresh, []);

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const handleAction = async (req: SubjectRequest, action: "approved" | "rejected") => {
    setProcessingId(req.id);

    try {
      let folderId: string | undefined;

      if (action === "approved") {
        folderId = getDriveFolderId(req.courseCode);

        if (!folderId) {
          // Create a Google Drive folder only once per approved course.
          const res = await fetch("/api/drive/folder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectName: req.subjectName,
              courseCode: req.courseCode,
            }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create Drive folder");
          }
          const data = await res.json();
          folderId = data.folderId;
        }
      }

      updateRequestStatus(req.id, action, folderId);
      toast.success(
        action === "approved"
          ? `Approved! Drive folder created.`
          : `Request rejected.`
      );
      refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Subject Requests"
        action={
          <div className="flex gap-1">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<FiInbox />} title="No requests found" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-800">{r.subjectName}</p>
                <p className="text-xs text-slate-400">
                  {r.courseCode} &middot; {r.teacherName} &middot; {r.department}
                </p>
                {r.message && (
                  <p className="mt-1 text-xs text-slate-500 italic">&ldquo;{r.message}&rdquo;</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Submitted {formatDate(r.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={r.status} />
                {r.status === "pending" && (
                  <>
                    <button
                      disabled={processingId === r.id}
                      onClick={() => handleAction(r, "approved")}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {processingId === r.id ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiCheck />
                      )}{" "}
                      Approve
                    </button>
                    <button
                      disabled={processingId === r.id}
                      onClick={() => handleAction(r, "rejected")}
                      className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <FiX /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
