"use client";
// ============================================================
// CourseDrop — Teacher: Student Preview
// Mirrors what students see for teacher-accessible subjects/files.
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  apiGetTeacherSharedCourses,
  apiListFiles,
  apiListRequests,
  apiListSubjects,
} from "@/lib/clientDataApi";
import { EmptyState } from "@/components/ui";
import FileCard from "@/components/FileCard";
import { Subject, StudyFile } from "@/lib/types";
import {
  FiArrowLeft,
  FiDownload,
  FiEye,
  FiFileText,
  FiFolder,
  FiLoader,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function TeacherStudentPreviewPage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setSelectedCourse(null);
      setFiles([]);
      setSelectedFiles(new Set());
      return;
    }

    const teacherKeys = Array.from(
      new Set([user.id, user.username].map((value) => value?.trim()).filter(Boolean))
    ) as string[];
    const teacherKeySet = new Set(teacherKeys);
    const teacherEmails = Array.from(
      new Set([user.email].map((value) => value?.trim().toLowerCase()).filter(Boolean))
    ) as string[];
    const teacherEmailSet = new Set(teacherEmails);

    const load = async () => {
      try {
        const [allSubjects, approvedRequests, sharedCourseCodes] = await Promise.all([
          apiListSubjects(),
          apiListRequests({ status: "approved" }),
          apiGetTeacherSharedCourses(user.id, user.username, user.email),
        ]);

        const accessibleCourseCodes = new Set<string>();
        for (const request of approvedRequests) {
          if (
            teacherKeySet.has(request.teacherId) ||
            teacherEmailSet.has(request.teacherEmail.trim().toLowerCase())
          ) {
            accessibleCourseCodes.add(request.courseCode);
          }
        }

        for (const courseCode of sharedCourseCodes) {
          accessibleCourseCodes.add(courseCode);
        }

        const accessibleSubjects = allSubjects.filter((subject) =>
          accessibleCourseCodes.has(subject.courseCode)
        );
        setSubjects(accessibleSubjects);

        if (selectedCourse && !accessibleCourseCodes.has(selectedCourse)) {
          setSelectedCourse(null);
          setFiles([]);
          setSelectedFiles(new Set());
        }
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Failed to load student preview data"
        );
      }
    };

    void load();
  }, [user, selectedCourse]);

  useEffect(() => {
    if (!selectedCourse) {
      setFiles([]);
      setSelectedFiles(new Set());
      return;
    }

    const loadFiles = async () => {
      try {
        setFiles(await apiListFiles(selectedCourse));
        setSelectedFiles(new Set());
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to load files");
      }
    };

    void loadFiles();
  }, [selectedCourse]);

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.subjectName.toLowerCase().includes(q) ||
        subject.courseCode.toLowerCase().includes(q) ||
        subject.department.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  const selectedSubject = subjects.find((subject) => subject.courseCode === selectedCourse);

  const handleSingleDownload = useCallback((file: StudyFile) => {
    if (file.driveFileId.startsWith("mock-")) {
      toast.error("This is a demo file and can't be downloaded.");
      return;
    }
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
      return;
    }

    setSelectedFiles(new Set(files.map((file) => file.id)));
  };

  const handleBatchDownload = async () => {
    const toDownload =
      selectedFiles.size > 0
        ? files.filter((file) => selectedFiles.has(file.id))
        : files;

    const realFiles = toDownload.filter((file) => !file.driveFileId.startsWith("mock-"));

    if (realFiles.length === 0) {
      toast.error("No real Drive files selected (demo files can't be downloaded).");
      return;
    }

    if (realFiles.length === 1) {
      handleSingleDownload(realFiles[0]);
      return;
    }

    setDownloading(true);
    try {
      const fileIds = realFiles.map((file) => file.driveFileId);
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

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${zipName}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${realFiles.length} files as ZIP`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <FiEye /> Student Preview
        </p>
        <p className="mt-1 text-sm text-indigo-600">
          This page shows the student-facing material view for your accessible subjects.
        </p>
        <Link
          href="/student"
          className="mt-3 inline-flex rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
        >
          Open full public Student Portal
        </Link>
      </div>

      {selectedCourse && selectedSubject ? (
        <>
          <button
            onClick={() => setSelectedCourse(null)}
            className="mb-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
          >
            <FiArrowLeft /> Back to subjects
          </button>

          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">{selectedSubject.subjectName}</h1>
              <p className="text-sm text-slate-400">
                {selectedSubject.courseCode} &middot; {selectedSubject.department} &middot; {files.length} file(s)
              </p>
            </div>

            {files.length > 0 && (
              <div className="flex items-center gap-2">
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
              subtitle="No files are available to students in this subject yet."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  selectable
                  selected={selectedFiles.has(file.id)}
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
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-800">Student View by Subject</h1>
            <p className="text-sm text-slate-400">
              Choose a subject to preview exactly what students see.
            </p>
          </div>

          <div className="relative mb-6 max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Search by subject name, code, or department..."
            />
          </div>

          {filteredSubjects.length === 0 ? (
            <EmptyState
              icon={<FiFolder />}
              title="No subjects available"
              subtitle="No accessible subjects found for this teacher account."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSubjects.map((subject) => (
                <button
                  key={subject.courseCode}
                  onClick={() => setSelectedCourse(subject.courseCode)}
                  className="group flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <FiFolder size={20} />
                  </div>
                  <p className="text-base font-bold text-slate-800">{subject.subjectName}</p>
                  <p className="text-xs text-slate-400">
                    {subject.courseCode} &middot; {subject.department}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-indigo-500">
                    {subject.fileCount} file(s)
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}