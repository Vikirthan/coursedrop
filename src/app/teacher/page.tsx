"use client";
// ============================================================
// CourseDrop — Teacher Dashboard
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAccessibleSubjects,
  getRequestsByTeacher,
  getFilesByCourse,
} from "@/lib/store";
import { SubjectRequest, StudyFile } from "@/lib/types";
import { StatCard, SectionHeader, StatusChip } from "@/components/ui";
import { FiSend, FiCheckCircle, FiFileText, FiClock } from "react-icons/fi";
import { formatDate } from "@/lib/utils";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [accessibleSubjectCount, setAccessibleSubjectCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const reqs = getRequestsByTeacher(user.id);
    setRequests(reqs);

    const accessible = getAccessibleSubjects(user.id);
    setAccessibleSubjectCount(accessible.length);

    const courseCodes = Array.from(new Set(accessible.map((s) => s.courseCode)));
    let count = 0;
    for (const c of courseCodes) count += getFilesByCourse(c).length;
    setFileCount(count);
  }, [user]);

  const pending = requests.filter((r) => r.status === "pending").length;

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
          value={requests.length}
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
          value={accessibleSubjectCount}
          icon={<FiCheckCircle />}
          accent="green"
        />
        <StatCard
          label="Files Uploaded"
          value={fileCount}
          icon={<FiFileText />}
          accent="purple"
        />
      </div>

      {/* Recent requests */}
      <SectionHeader title="My Recent Requests" />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.slice(0, 6).map((r) => (
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
            {requests.length === 0 && (
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
