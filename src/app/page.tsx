"use client";
// ============================================================
// CourseDrop — Landing Page
// ============================================================

import Link from "next/link";
import {
  FiBookOpen,
  FiShield,
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
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-indigo-200 dark:ring-slate-700">
              CD
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">CourseDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login/teacher"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Teacher Login
            </Link>
            <Link
              href="/student"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors"
            >
              Student Portal
            </Link>
            <div className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* ---- Hero ---- */}
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-950/40 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900">
            <FiBookOpen /> Academic Material Portal
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-6xl">
            Your Course Materials,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              One Click Away
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            CourseDrop lets teachers share lecture notes, slides, and lab manuals —
            and students can access them instantly, no login required.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/student"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 px-7 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              Browse Materials <FiArrowRight />
            </Link>
            <Link
              href="/login/teacher"
              className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 px-7 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
            >
              Teacher Portal
            </Link>
          </div>
        </section>

        {/* ---- Features ---- */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
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
              {
                icon: <FiShield size={28} />,
                title: "Google Drive Backed",
                desc: "All files are stored on Google Drive — organized by course code — for reliable access.",
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
          © {new Date().getFullYear()} CourseDrop — Built for modern education.
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
