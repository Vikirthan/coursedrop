"use client";
// ============================================================
// CourseDrop — Admin Teacher Approvals Page
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { formatTeacherDisplayName, inferDesignationFromDepartment } from "@/lib/utils";

interface Teacher {
  id: string;
  full_name: string;
  uid: string;
  contact: string;
  email: string;
  department: string;
  designation?: string | null;
  approved: boolean;
  created_at: string;
  approved_at?: string | null;
}

function isPendingTeacher(teacher: Teacher): boolean {
  return !teacher.approved && !(teacher.approved_at && teacher.approved_at.trim().length > 0);
}

export default function AdminTeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchTeachers();
  }, [user, router]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers");
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacherId: string) => {
    setUpdating(teacherId);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teacherId, approved: true }),
      });
      if (res.ok) {
        await fetchTeachers();
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        console.error("Error approving teacher:", data.error ?? "Request failed");
      }
    } catch (err) {
      console.error("Error approving teacher:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleRevoke = async (teacherId: string) => {
    setUpdating(teacherId);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teacherId, approved: false }),
      });
      if (res.ok) {
        await fetchTeachers();
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        console.error("Error revoking teacher:", data.error ?? "Request failed");
      }
    } catch (err) {
      console.error("Error revoking teacher:", err);
    } finally {
      setUpdating(null);
    }
  };

  const pendingTeachers = teachers.filter(isPendingTeacher);
  const approvedTeachers = teachers.filter((t) => t.approved);
  const displayTeachers =
    filter === "pending" ? pendingTeachers : approvedTeachers;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
            <FiArrowLeft size={18} /> Admin Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
            Teacher Approvals
          </h1>
          <p className="mt-2 text-slate-500">
            Manage teacher account requests and access
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 sm:gap-4 sm:pb-0">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-3 text-sm font-medium transition ${
              filter === "pending"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending Approval ({pendingTeachers.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-3 text-sm font-medium transition ${
              filter === "approved"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Approved ({approvedTeachers.length})
          </button>
          <button
            onClick={fetchTeachers}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:ml-auto"
            disabled={loading}
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading teachers...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && displayTeachers.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <FiCheckCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-600">
              {filter === "pending"
                ? "No pending teacher requests"
                : "No approved teachers"}
            </p>
          </div>
        )}

        {/* Teachers List */}
        {!loading && displayTeachers.length > 0 && (
          <div className="space-y-3">
            {displayTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 sm:p-5"
              >
                <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">
                      {formatTeacherDisplayName(
                        teacher.full_name,
                        teacher.designation ?? inferDesignationFromDepartment(teacher.department)
                      )}
                    </h3>
                    <div className="mt-2 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500">UID</p>
                        <p className="font-mono">{teacher.uid}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Email</p>
                        <p>{teacher.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Contact</p>
                        <p>{teacher.contact}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Department</p>
                        <p>{teacher.department}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                    {!teacher.approved && (
                      <>
                        <button
                          onClick={() => handleApprove(teacher.id)}
                          disabled={updating === teacher.id}
                          className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition"
                        >
                          <FiCheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRevoke(teacher.id)}
                          disabled={updating === teacher.id}
                          className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <FiXCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                    {teacher.approved && (
                      <button
                        onClick={() => handleRevoke(teacher.id)}
                        disabled={updating === teacher.id}
                        className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
                      >
                        <FiXCircle size={16} />
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
