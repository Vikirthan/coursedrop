"use client";
// ============================================================
// CourseDrop — Teacher: Submit & Track Subject Requests
// ============================================================

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiCreateRequest, apiListRequests } from "@/lib/clientDataApi";
import { SubjectRequest } from "@/lib/types";
import { SectionHeader, StatusChip, EmptyState } from "@/components/ui";
import { formatDate, formatTeacherDisplayName } from "@/lib/utils";
import { FiSend, FiInbox, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";

export default function TeacherRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [subjectName, setSubjectName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async (showError = true) => {
    if (!user) return;
    try {
      const teacherKeys = Array.from(
        new Set([user.id, user.username].map((value) => value?.trim()).filter(Boolean))
      ) as string[];
      const teacherEmails = Array.from(
        new Set([user.email].map((value) => value?.trim().toLowerCase()).filter(Boolean))
      ) as string[];
      const next = await apiListRequests({
        teacherIds: teacherKeys,
        teacherEmails,
      });
      setRequests(next);
    } catch (err) {
      console.error(err);
      if (showError) {
        toast.error(err instanceof Error ? err.message : "Failed to load requests");
      }
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refresh, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const tick = () => {
      void refresh(false);
    };

    const intervalId = window.setInterval(tick, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await apiCreateRequest({
        teacherId: user.id,
        teacherName: formatTeacherDisplayName(user.name, user.designation),
        teacherEmail: user.email,
        subjectName,
        courseCode: courseCode.toUpperCase(),
        department,
        message,
      });

      toast.success("Request submitted!");
      setShowForm(false);
      setSubjectName("");
      setCourseCode("");
      setDepartment("");
      setMessage("");
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    }
  };

  return (
    <div>
      <SectionHeader
        title="My Subject Requests"
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
          >
            <FiPlus /> {showForm ? "Cancel" : "New Request"}
          </button>
        }
      />

      {/* New-request form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Subject Name
              </label>
              <input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. Data Structures"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Course Code
              </label>
              <input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. CS201"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Department
            </label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. Computer Science"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Why you'd like access…"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
          >
            <FiSend /> Submit Request
          </button>
        </form>
      )}

      {/* Request list */}
      {requests.length === 0 ? (
        <EmptyState
          icon={<FiInbox />}
          title="No requests yet"
          subtitle="Click 'New Request' to request access to a subject."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-800">{r.subjectName}</p>
                <p className="text-xs text-slate-400">
                  {r.courseCode} &middot; {r.department} &middot;{" "}
                  {formatDate(r.createdAt)}
                </p>
                {r.message && (
                  <p className="mt-1 text-xs italic text-slate-500">
                    &ldquo;{r.message}&rdquo;
                  </p>
                )}
              </div>
              <StatusChip
                status={
                  r.status === "approved" && !(r.driveFolderId ?? "").trim()
                    ? "approved-deleted"
                    : r.status
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
