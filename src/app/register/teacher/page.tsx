"use client";
// ============================================================
// CourseDrop — Teacher Registration Page
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiCheckCircle, FiLoader, FiAlertCircle } from "react-icons/fi";
import { isGithubPagesRuntime } from "@/lib/runtime";
import ThemeToggle from "@/components/ThemeToggle";

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
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
        {/* Theme Toggle */}
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-40 top-0 h-80 w-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
          <div className="absolute -left-40 top-40 h-80 w-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-slate-200/50 bg-white/80 dark:border-slate-700/50 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl dark:shadow-2xl/20 transition-all duration-300 text-center">
            <FiCheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              Account Created!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your teacher account has been created and is pending admin approval. 
              Once approved, you'll be able to log in with your credentials.
            </p>
            <Link
              href="/login/teacher"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-3 font-bold text-white hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              Go to Login <FiArrowRight />
            </Link>
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-40 top-0 h-80 w-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute -left-40 top-40 h-80 w-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute right-1/3 -bottom-40 h-80 w-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-slate-200/50 bg-white/80 dark:border-slate-700/50 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl dark:shadow-2xl/20 transition-all duration-300">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-2xl font-bold text-white shadow-lg ring-4 ring-offset-2 dark:ring-offset-slate-900 ring-indigo-100 dark:ring-slate-800 transition-transform duration-300 hover:scale-110">
              T
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Teacher Registration
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create your account and wait for admin approval
            </p>
          </div>

          {isGithubPagesRuntime() && error && (
            <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
              <FiAlertCircle className="mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" size={16} />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Registration requires backend APIs. Not available on GitHub Pages. Use Vercel for full functionality.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Username *
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                placeholder="johndoe"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                placeholder="john@example.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password (min. 8 characters) *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              {password && !validatePassword(password) && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                required
                disabled={loading}
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

            {/* Error message */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex gap-2">
                <FiAlertCircle className="mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" size={16} />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 py-3 px-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 space-y-3 text-center text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login/teacher" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Bottom info */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Protected by industry-standard encryption
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
