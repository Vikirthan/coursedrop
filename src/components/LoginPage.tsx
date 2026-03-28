"use client";
// ============================================================
// CourseDrop — Enhanced Login Page Component
// ============================================================

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isGithubPagesRuntime } from "@/lib/runtime";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { FiLogIn, FiLoader, FiAlertCircle } from "react-icons/fi";

interface LoginPageProps {
  role: "admin" | "teacher";
}

export default function LoginPage({ role }: LoginPageProps) {
  const { login, user, loading: authLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGithubPages, setIsGithubPages] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsGithubPages(isGithubPagesRuntime());
  }, []);

  useEffect(() => {
    if (!isInitialized || !user) {
      return;
    }

    const destination = user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/";
    router.replace(destination);
  }, [isInitialized, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const err = await login(identifier, password, role);
      if (err) {
        setError(err);
      } else {
        router.replace(role === "admin" ? "/admin" : "/teacher");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === "admin";
  const accent = isAdmin ? "from-violet-600 to-purple-700" : "from-indigo-600 to-blue-700";

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
        <div className="absolute right-1/3 -bottom-40 h-80 w-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-slate-200/50 bg-white/80 dark:border-slate-700/50 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl dark:shadow-2xl/20 transition-all duration-300">
          {/* Header */}
          <div className="mb-8 text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-2xl font-bold text-white shadow-lg ring-4 ring-offset-2 dark:ring-offset-slate-900 ring-indigo-100 dark:ring-slate-800 transition-transform duration-300 hover:scale-110`}
            >
              {isAdmin ? "A" : "TC"}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              {isAdmin ? "Admin Login" : "Teacher/CR Login"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAdmin ? "Manage courses and teachers" : "Access your course materials as Teacher/CR"}
            </p>
          </div>

          {/* GitHub Pages warning */}
          {!isAdmin && isGithubPages && (
            <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
              <FiAlertCircle className="mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" size={16} />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Teacher/CR login requires backend APIs. Not available on GitHub Pages. Use Vercel for full functionality.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* UID input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isAdmin ? "Admin ID" : "UID (Teacher/CR Unique ID)"}
              </label>
              <div className="relative">
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  placeholder={isAdmin ? "Enter admin ID" : "Enter your Teacher/CR UID"}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
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
              disabled={loading || !identifier || !password}
              className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${accent} py-3 px-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <FiLogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 space-y-4 text-center text-sm">
            {!isAdmin && (
              <p className="text-slate-600 dark:text-slate-400">
                Don't have an account?{" "}
                <Link
                  href="/register/teacher"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                >
                  Create Teacher/CR account
                </Link>
              </p>
            )}
            {!isAdmin && (
              <p className="text-slate-600 dark:text-slate-400">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </p>
            )}
            {!isAdmin && <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>}
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
