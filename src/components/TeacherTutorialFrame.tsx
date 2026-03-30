"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiCheckCircle,
  FiFolder,
  FiHelpCircle,
  FiSend,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

interface TeacherTutorialFrameProps {
  userId: string;
  children: React.ReactNode;
}

interface TutorialStep {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Request a subject",
    description:
      "Go to My Requests and click New Request. Fill subject name, course code, and department, then submit.",
    href: "/teacher/requests",
    icon: <FiSend />,
  },
  {
    title: "After request submission",
    description:
      "Your request shows as pending until admin review. Once approved, you can access the subject in Upload.",
    href: "/teacher/requests",
    icon: <FiCheckCircle />,
  },
  {
    title: "Create subject folder",
    description:
      "Folder creation is automatic. When your request is approved, select that course in Upload and upload your first file.",
    href: "/teacher/upload",
    icon: <FiFolder />,
  },
  {
    title: "Upload materials",
    description:
      "Open Upload, choose an approved subject, optionally set section name, and add files in the upload box.",
    href: "/teacher/upload",
    icon: <FiUploadCloud />,
  },
  {
    title: "Delete a file",
    description:
      "In Upload, use the delete action on a file card. You can delete your own files or any file in a subject you own.",
    href: "/teacher/upload",
    icon: <FiTrash2 />,
  },
  {
    title: "Delete entire subject folder",
    description:
      "In Upload, select your owned subject and use Delete Subject Folder. Confirm with your password to remove all files.",
    href: "/teacher/upload",
    icon: <FiTrash2 />,
  },
];

function TutorialList({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={compact ? "space-y-3" : "space-y-4"}>
      {TUTORIAL_STEPS.map((step, idx) => (
        <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
              {step.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {idx + 1}. {step.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.description}</p>
              {!compact && (
                <Link
                  href={step.href}
                  className="mt-2 inline-block text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  Open this page
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function TeacherTutorialFrame({ userId, children }: TeacherTutorialFrameProps) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const storageKey = useMemo(
    () => `coursedrop.teacher.tutorial.seen.${userId}`,
    [userId]
  );

  useEffect(() => {
    const hasSeen = window.localStorage.getItem(storageKey);
    if (hasSeen) {
      return;
    }

    window.localStorage.setItem(storageKey, "1");
    setIsTutorialOpen(true);
  }, [storageKey]);

  return (
    <>
      <div className="flex flex-1 overflow-hidden bg-slate-50">
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <FiBookOpen />
              Tutorial
            </button>
          </div>
          {children}
        </main>

        <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto p-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Teacher/CR Tutorial</p>
              <h3 className="mt-1 text-base font-bold text-slate-800">How CourseDrop works</h3>
              <p className="mt-1 text-xs text-slate-600">
                Keep this as a quick checklist while requesting, uploading, and managing folders.
              </p>
              <button
                type="button"
                onClick={() => setIsTutorialOpen(true)}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <FiHelpCircle />
                Open full tutorial
              </button>
            </div>

            <div className="mt-4">
              <TutorialList compact />
            </div>
          </div>
        </aside>
      </div>

      {isTutorialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-50 p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Welcome to CourseDrop</p>
                <h2 className="text-xl font-bold text-slate-900">Teacher/CR Quick Tutorial</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Follow these steps to request access, upload files, and safely manage folders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTutorialOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                aria-label="Close tutorial"
              >
                <FiX />
              </button>
            </div>

            <TutorialList />

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTutorialOpen(false)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}