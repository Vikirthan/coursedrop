"use client";
// ============================================================
// CourseDrop — Password Verification Modal
// ============================================================

import React, { useState } from "react";
import { FiX, FiLock, FiAlertCircle } from "react-icons/fi";

interface PasswordModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function PasswordModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
  error = "",
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!password.trim()) {
      setLocalError("Password is required");
      return;
    }

    try {
      await onConfirm(password);
      setPassword("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleCancel = () => {
    setPassword("");
    setLocalError("");
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <FiX size={20} />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <FiLock size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Enter your password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20"
                placeholder="••••••••"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Error message */}
            {(error || localError) && (
              <div className="flex gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <FiAlertCircle className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" size={16} />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error || localError}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
