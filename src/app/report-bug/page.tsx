"use client";
// ============================================================
// CourseDrop — Report a Bug
// ============================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiCreateBugReport } from "@/lib/clientDataApi";
import { FiAlertCircle, FiArrowLeft, FiCheckCircle } from "react-icons/fi";

export default function ReportBugPage() {
  const { user } = useAuth();

  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setReporterName(user.name ?? "");
      setReporterEmail(user.email ?? "");
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const source = (params.get("source") ?? "").trim();
      if (source) {
        setPagePath(source.startsWith("/") ? source : `/${source}`);
      } else {
        setPagePath(window.location.pathname);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("Please describe the bug.");
      return;
    }

    if (message.trim().length < 8) {
      setError("Please add a bit more detail so admins can reproduce it.");
      return;
    }

    setLoading(true);
    try {
      await apiCreateBugReport({
        reporterName,
        reporterEmail,
        reporterRole: user?.role ?? "guest",
        pagePath,
        message,
      });

      setSubmitted(true);
      setMessage("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href={user?.role === "admin" ? "/admin" : user?.role === "teacher" ? "/teacher" : "/student"}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
        >
          <FiArrowLeft /> Back
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
            <FiAlertCircle className="text-indigo-600" /> Report a Bug
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Send this directly to the admin bug inbox so issues can be tracked and resolved.
          </p>

          {submitted && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <FiCheckCircle className="mt-0.5" />
              Bug report submitted. Admin can now triage it from the Bug Reports page.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Your Name
                </label>
                <input
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Your Email
                </label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Page / Feature
              </label>
              <input
                value={pagePath}
                onChange={(e) => setPagePath(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. /teacher/upload"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Bug Description
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="What happened? What did you expect? Steps to reproduce..."
                required
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Bug Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
