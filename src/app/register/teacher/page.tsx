"use client";
// ============================================================
// CourseDrop — Teacher Registration Page
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { isGithubPagesRuntime } from "@/lib/runtime";

export default function TeacherRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string) => pwd.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isGithubPagesRuntime()) {
      setError(
        "Teacher registration needs backend APIs and is disabled on GitHub Pages. Deploy to Vercel for full functionality."
      );
      return;
    }

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!department) {
      setError("Department is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/teacher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          username,
          email,
          password,
          department,
        }),
      });

      if (res.status === 201) {
        setSuccess(true);
      } else if (res.status === 409) {
        setError("Username or email already registered");
      } else {
        const data = await res.json();
        const message = data.error || "Registration failed. Please try again.";
        if (message.includes("Missing Supabase configuration")) {
          setError(
            "Server is missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your hosting dashboard, then redeploy."
          );
        } else {
          setError(message);
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <FiCheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
          <h1 className="text-2xl font-extrabold text-slate-800 mb-3">
            Account Created!
          </h1>
          <p className="text-slate-600 mb-6">
            Your teacher account has been created and is pending admin approval. 
            Once approved, you'll be able to log in with your credentials.
          </p>
          <Link
            href="/login/teacher"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700"
          >
            Go to Login <FiArrowRight />
          </Link>
          <p className="mt-6 text-sm text-slate-400">
            <Link href="/" className="text-indigo-600 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-lg font-bold text-white shadow-md">
            T
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Teacher Registration
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create your account and wait for admin approval
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Full Name *
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Username *
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="johndoe"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Password (min. 8 characters) *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="••••••••"
              required
            />
            {password && !validatePassword(password) && (
              <p className="mt-1 text-xs text-red-600">
                Password must be at least 8 characters
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              required
            >
              <option value="">Select a department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electronics">Electronics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login/teacher" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-slate-400">
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
