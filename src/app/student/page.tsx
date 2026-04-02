"use client";
// ============================================================
// CourseDrop — Student Portal (no auth required)
// Real Google Drive download + batch ZIP support
// ============================================================

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiListFiles, apiListSubjects } from "@/lib/clientDataApi";
import { Subject, StudyFile } from "@/lib/types";
import { EmptyState } from "@/components/ui";
import FileCard from "@/components/FileCard";
import {
  FiBookOpen,
  FiSearch,
  FiFolder,
  FiArrowLeft,
  FiFileText,
  FiDownload,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function StudentPortal() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async (showError = true) => {
      try {
        const nextSubjects = await apiListSubjects();
        if (!cancelled) {
          setSubjects(nextSubjects);
        }
      } catch (err) {
        console.error(err);
        if (showError) {
          toast.error(err instanceof Error ? err.message : "Failed to load subjects");
        }
      }
    };

    const tick = () => {
      void load(false);
    };

    void load(true);

    const intervalId = window.setInterval(tick, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setFiles([]);
      setSelectedFiles(new Set());
      return;
    }

    let cancelled = false;

    const load = async (showError = true, resetSelection = false) => {
      try {
        const nextFiles = await apiListFiles(selectedCourse, {
          forceSync: resetSelection,
        });
        if (cancelled) {
          return;
        }

        setFiles(nextFiles);
        setSelectedFiles((prev) => {
          if (resetSelection) {
            return new Set();
          }

          const nextIds = new Set(nextFiles.map((file) => file.id));
          return new Set(Array.from(prev).filter((id) => nextIds.has(id)));
        });
      } catch (err) {
        console.error(err);
        if (showError) {
          toast.error(err instanceof Error ? err.message : "Failed to load files");
        }
      }
    };

    const tick = () => {
      void load(false, false);
    };

    void load(true, true);

    const intervalId = window.setInterval(tick, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [selectedCourse]);

  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.filter(
      (s) =>
        s.subjectName.toLowerCase().includes(q) ||
        s.courseCode.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  const selectedSubject = subjects.find((s) => s.courseCode === selectedCourse);

  // ---- Download handlers ----

  const handleSingleDownload = useCallback((file: StudyFile) => {
    window.open(`/api/drive/download?fileId=${file.driveFileId}`, "_blank");
  }, []);

  const handleSelectToggle = useCallback((id: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const handleBatchDownload = async () => {
    // Determine which files to download
    const toDownload = selectedFiles.size > 0
      ? files.filter((f) => selectedFiles.has(f.id))
      : files;

    // If only one file, just do a single download
    if (toDownload.length === 1) {
      handleSingleDownload(toDownload[0]);
      return;
    }

    setDownloading(true);
    try {
      const fileIds = toDownload.map((f) => f.driveFileId);
      const zipName = selectedSubject
        ? `${selectedSubject.courseCode}-${selectedSubject.subjectName}`
        : "CourseDrop-Materials";

      const res = await fetch("/api/drive/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds, zipName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ZIP download failed");
      }

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${toDownload.length} files as ZIP`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ---- Header ---- */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.svg" alt="CourseDrop logo" width={36} height={36} className="h-9 w-9 rounded-xl" priority />
            <span className="text-lg font-extrabold text-slate-800">CourseDrop</span>
          </Link>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 text-xs text-slate-500 sm:w-auto sm:gap-3 sm:text-sm">
            <div className="flex items-center gap-2">
              <FiBookOpen />
              <span className="font-semibold">Student Portal</span>
            </div>
            <Link
              href="/report-bug?source=/student"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Report Bug
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* If viewing a specific subject's files */}
        {selectedCourse && selectedSubject ? (
          <>
            <button
              onClick={() => setSelectedCourse(null)}
              className="mb-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
            >
              <FiArrowLeft /> Back to subjects
            </button>

            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
                  {selectedSubject.subjectName}
                </h1>
                <p className="text-sm text-slate-400">
                  {selectedSubject.courseCode} &middot; {selectedSubject.department} &middot;{" "}
                  {files.length} file(s)
                </p>
              </div>

              {/* Batch Download Controls */}
              {files.length > 0 && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <button
                    onClick={handleSelectAll}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    {selectedFiles.size === files.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={handleBatchDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {downloading ? (
                      <FiLoader className="animate-spin" size={14} />
                    ) : (
                      <FiDownload size={14} />
                    )}
                    {selectedFiles.size > 0
                      ? `Download ${selectedFiles.size} Selected`
                      : "Download All"}
                  </button>
                </div>
              )}
            </div>

            {files.length === 0 ? (
              <EmptyState
                icon={<FiFileText />}
                title="No materials yet"
                subtitle="The teacher hasn't uploaded any files to this subject yet."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {files.map((f, index) => (
                  <FileCard
                    key={f.id}
                    file={f}
                    serialNumber={index + 1}
                    selectable
                    selected={selectedFiles.has(f.id)}
                    showSection
                    showUploader
                    onSelect={handleSelectToggle}
                    onDownload={handleSingleDownload}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Subject browser */
          <>
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
                Browse Study Materials
              </h1>
              <p className="text-sm text-slate-400">
                Select a subject to view available notes, slides, and lab manuals.
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Search by subject name, code, or department…"
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<FiFolder />}
                title="No subjects found"
                subtitle={
                  search
                    ? "Try a different search term."
                    : "No subjects have been approved yet."
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => (
                  <button
                    key={s.courseCode}
                    onClick={() => setSelectedCourse(s.courseCode)}
                    className="group flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <FiFolder size={20} />
                    </div>
                    <p className="text-base font-bold text-slate-800">{s.subjectName}</p>
                    <p className="text-xs text-slate-400">
                      {s.courseCode} &middot; {s.department}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-indigo-500">
                      {s.fileCount} file(s)
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
