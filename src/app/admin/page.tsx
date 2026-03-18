"use client";
// ============================================================
// CourseDrop — Admin Dashboard
// ============================================================

import React, { useEffect, useState } from "react";
import { FiUsers, FiFileText, FiCheckCircle, FiClock } from "react-icons/fi";
import { StatCard, SectionHeader } from "@/components/ui";
import { getRequests, getFiles, getAllSubjects } from "@/lib/store";
import { SubjectRequest, StudyFile } from "@/lib/types";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [files, setFiles] = useState<StudyFile[]>([]);

  useEffect(() => {
    setRequests(getRequests());
    setFiles(getFiles());
  }, []);

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const subjects = getAllSubjects();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-800">Admin Dashboard</h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={requests.length}
          icon={<FiUsers />}
          accent="blue"
        />
        <StatCard
          label="Pending"
          value={pending}
          icon={<FiClock />}
          accent="amber"
        />
        <StatCard
          label="Approved Subjects"
          value={approved}
          icon={<FiCheckCircle />}
          accent="green"
        />
        <StatCard
          label="Total Files"
          value={files.length}
          icon={<FiFileText />}
          accent="purple"
        />
      </div>

      {/* Recent requests */}
      <SectionHeader title="Recent Requests" />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">Teacher</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.slice(0, 5).map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-700">{r.teacherName}</td>
                <td className="px-5 py-3 text-slate-600">{r.subjectName}</td>
                <td className="px-5 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {r.courseCode}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${
                      r.status === "approved"
                        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                        : r.status === "rejected"
                        ? "border-red-300 bg-red-100 text-red-800"
                        : "border-amber-300 bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
