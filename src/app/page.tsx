"use client";
// ============================================================
// CourseDrop — Landing Page
// ============================================================

import Link from "next/link";
import {
  FiBookOpen,
  FiUploadCloud,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-40 top-0 h-80 w-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute -left-40 top-40 h-80 w-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute right-1/3 bottom-0 h-80 w-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* ---- Navbar ---- */}
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-indigo-200 dark:ring-slate-700">
              CD
            </div>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white sm:text-xl">CourseDrop</span>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            <Link
              href="/login/teacher"
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4 sm:text-sm"
            >
              Teacher Login
            </Link>
            <Link
              href="/student"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-indigo-700 dark:hover:bg-indigo-500 sm:px-5 sm:text-sm"
            >
              Student Portal
            </Link>
            <div className="ml-1 border-l border-slate-200 pl-2 dark:border-slate-700 sm:ml-2">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* ---- Hero ---- */}
        <section className="mx-auto max-w-4xl px-4 pb-14 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-950/40 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900">
            <FiBookOpen /> Academic Material Portal
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-6xl">
            Your Course Materials,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              One Click Away
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            CourseDrop lets teachers share lecture notes, slides, and lab manuals —
            and students can access them instantly, no login required.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
            <Link
              href="/student"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95 sm:px-7 sm:py-3 sm:text-sm"
            >
              Browse Materials <FiArrowRight />
            </Link>
            <Link
              href="/login/teacher"
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 transition-all duration-200 hover:bg-slate-100 active:scale-95 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-7 sm:py-3 sm:text-sm"
            >
              Teacher Portal
            </Link>
          </div>
        </section>

        {/* ---- Features ---- */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <FiUploadCloud size={28} />,
                title: "Easy Uploads",
                desc: "Teachers can drag-and-drop PDFs, slides, images and text files into their approved subjects.",
              },
              {
                icon: <FiUsers size={28} />,
                title: "Access Control",
                desc: "Admins approve teacher access per subject. Students browse without logging in.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm p-7 shadow-sm dark:shadow-lg/20 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg/30 hover:border-indigo-200 dark:hover:border-indigo-700"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-900">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Footer ---- */}
        <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} CourseDrop — Built for modern education.</p>
          <p className="mt-1">Created and tested by : Vikirthan T (12307334)</p>
        </footer>
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
