"use client";
// ============================================================
// CourseDrop — Teacher Dashboard
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetTeacherSharedCourses,
  apiListFiles,
  apiListRequests,
} from "@/lib/clientDataApi";
import { SubjectRequest } from "@/lib/types";
import { StatCard, SectionHeader, StatusChip } from "@/components/ui";
import { FiSend, FiCheckCircle, FiFileText, FiClock } from "react-icons/fi";
import { formatDate } from "@/lib/utils";

export default function TeacherDashboard() {
  const { user, isInitialized } = useAuth();
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [accessibleSubjectCount, setAccessibleSubjectCount] = useState(0);
  const hasSessionUser = isInitialized && !!user;

  useEffect(() => {
    if (!hasSessionUser || !user) {
      return;
    }

    const teacherKeys = Array.from(
      new Set([user.id, user.username].map((value) => value?.trim()).filter(Boolean))
    ) as string[];
    const teacherKeySet = new Set(teacherKeys);
    const teacherEmails = Array.from(
      new Set([user.email].map((value) => value?.trim().toLowerCase()).filter(Boolean))
    ) as string[];
    const teacherEmailSet = new Set(teacherEmails);

    const load = async () => {
      try {
        const [ownRequests, approvedRequests, sharedCourseCodes, files] =
          await Promise.all([
            apiListRequests({ teacherIds: teacherKeys, teacherEmails }),
            apiListRequests({ status: "approved" }),
            apiGetTeacherSharedCourses(user.id, user.username, user.email),
            apiListFiles(),
          ]);

        setRequests(ownRequests);

        const ownApprovedCourses = new Set(
          approvedRequests
            .filter(
              (request) =>
                teacherKeySet.has(request.teacherId) ||
                teacherEmailSet.has(request.teacherEmail.trim().toLowerCase())
            )
            .map((request) => request.courseCode)
        );

        for (const code of sharedCourseCodes) {
          ownApprovedCourses.add(code);
        }

        const accessibleCourses = Array.from(ownApprovedCourses);
        setAccessibleSubjectCount(accessibleCourses.length);

        const accessibleCourseSet = new Set(accessibleCourses);
        const totalFiles = files.reduce((count, file) =>
          accessibleCourseSet.has(file.courseCode) ? count + 1 : count,
        0);

        setFileCount(totalFiles);
      } catch (err) {
        console.error(err);
      }
    };

    const tick = () => {
      void load();
    };

    const initialLoadId = window.setTimeout(tick, 0);

    const intervalId = window.setInterval(tick, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hasSessionUser, user]);

  const visibleRequests = useMemo(
    () => (hasSessionUser ? requests : []),
    [hasSessionUser, requests]
  );
  const pending = visibleRequests.filter((r) => r.status === "pending").length;
  const visibleFileCount = hasSessionUser ? fileCount : 0;
  const visibleAccessibleSubjectCount = hasSessionUser ? accessibleSubjectCount : 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-800">
        Welcome back, {user?.name?.split(" ")[0]} 👋
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Here&apos;s a quick overview of your activity.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={visibleRequests.length}
          icon={<FiSend />}
          accent="blue"
        />
        <StatCard
          label="Pending"
          value={pending}
          icon={<FiClock />}
          accent="amber"
        />
        <StatCard
          label="Accessible Subjects"
          value={visibleAccessibleSubjectCount}
          icon={<FiCheckCircle />}
          accent="green"
        />
        <StatCard
          label="Files Uploaded"
          value={visibleFileCount}
          icon={<FiFileText />}
          accent="purple"
        />
      </div>

      {/* Recent requests */}
      <SectionHeader title="My Recent Requests" />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRequests.slice(0, 6).map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-700">{r.subjectName}</td>
                <td className="px-5 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {r.courseCode}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                <td className="px-5 py-3">
                  <StatusChip status={r.status} />
                </td>
              </tr>
            ))}
            {visibleRequests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No requests yet — submit one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
