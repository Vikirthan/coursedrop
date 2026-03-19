"use client";
// ============================================================
// CourseDrop — Forgot Password Page
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string) => pwd.length >= 8;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/teacher/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "request_otp" }),
      });

      if (res.ok) {
        setStep("otp");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }
    if (!validatePassword(newPassword)) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/teacher/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          action: "reset_password",
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-slate-200/50 bg-white/80 dark:border-slate-700/50 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl dark:shadow-2xl/20 transition-all duration-300 text-center">
            <FiCheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              Password Reset!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link
              href="/login/teacher"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-3 font-bold text-white hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              Go to Login
            </Link>
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-slate-200/50 bg-white/80 dark:border-slate-700/50 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl dark:shadow-2xl/20 transition-all duration-300">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {step === "email" && "Enter your email to receive an OTP"}
              {step === "otp" && "Enter the OTP and your new password"}
              {step === "reset" && "Set your new password"}
            </p>
          </div>

          {step === "email" && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex gap-2">
                  <FiAlertCircle className="mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" size={16} />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 py-3 px-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "Sending OTP..." : "Send OTP via Email"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  OTP *
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  placeholder="000000"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Check your email for the 6-digit code</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  New Password (min. 8 characters) *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                {newPassword && !validatePassword(newPassword) && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Password must be at least 8 characters
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Passwords do not match
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex gap-2">
                  <FiAlertCircle className="mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" size={16} />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 py-3 px-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setNewPassword("");
                  setNewPasswordConfirm("");
                  setError("");
                }}
                className="w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
              >
                ← Back to email
              </button>
            </form>
          )}

          {/* Footer links */}
          <div className="mt-8 space-y-3 text-center text-sm">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
            <Link
              href="/login/teacher"
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              <FiArrowLeft size={16} /> Back to login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
}
