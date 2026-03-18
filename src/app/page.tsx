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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ---- Navbar ---- */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md">
            CD
          </div>
          <span className="text-xl font-extrabold text-slate-800">CourseDrop</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login/teacher"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Teacher Login
          </Link>
          <Link
            href="/student"
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
          >
            Student Portal
          </Link>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700">
          <FiBookOpen /> Academic Material Portal
        </div>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
          Your Course Materials,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            One Click Away
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
          CourseDrop lets teachers share lecture notes, slides, and lab manuals —
          and students can access them instantly, no login required.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/student"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 hover:shadow-xl"
          >
            Browse Materials <FiArrowRight />
          </Link>
          <Link
            href="/login/teacher"
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-7 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CourseDrop — Built for modern education.
      </footer>
    </div>
  );
}
