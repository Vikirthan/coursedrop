"use client";
// ============================================================
// CourseDrop — Shared Login Page Component
// ============================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FiLogIn, FiLoader } from "react-icons/fi";

interface LoginPageProps {
  role: "admin" | "teacher";
}

export default function LoginPage({ role }: LoginPageProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const err = await login(identifier, password, role);
      if (err) {
        setError(err);
      } else {
        router.push(role === "admin" ? "/admin" : "/teacher");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-lg font-bold text-white shadow-md`}
          >
            {isAdmin ? "A" : "T"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            {isAdmin ? "Admin Login" : "Teacher Login"}
          </h1>
          {isAdmin && (
            <p className="mt-1 text-sm text-slate-400">
              Use dummy credentials:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-600">
                admin / admin123
              </code>
            </p>
          )}
          {!isAdmin && (
            <p className="mt-1 text-sm text-slate-400">
              Enter your registered account credentials
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              {isAdmin ? "Username" : "Username or Email"}
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder={isAdmin ? "Enter username" : "username or email"}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${accent} py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? <FiLoader className="animate-spin" /> : <FiLogIn />}
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm text-slate-400">
          {!isAdmin && (
            <>
              <p>
                Don't have an account?{" "}
                <Link href="/register/teacher" className="text-indigo-600 font-medium hover:underline">
                  Create one
                </Link>
              </p>
              <hr className="my-2" />
            </>
          )}
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
