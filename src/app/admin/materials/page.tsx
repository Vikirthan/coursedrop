"use client";
// ============================================================
// CourseDrop — Admin: Browse All Materials
// ============================================================

import React, { useEffect, useState } from "react";
import { getAllSubjects, getFilesByCourse, deleteFile } from "@/lib/store";
import { StudyFile, Subject } from "@/lib/types";
import { SectionHeader, EmptyState } from "@/components/ui";
import FileCard from "@/components/FileCard";
import ConfirmModal from "@/components/ConfirmModal";
import { FiFileText, FiFolder } from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminMaterialsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const refresh = () => {
    const subs = getAllSubjects();
    setSubjects(subs);
    if (selectedCourse) setFiles(getFilesByCourse(selectedCourse));
  };

  useEffect(refresh, [selectedCourse]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteFile(deleteTarget);
    toast.success("File deleted");
    setDeleteTarget(null);
    refresh();
  };

  return (
    <div>
      <SectionHeader title="All Study Materials" />

      {/* Subject list */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCourse(null)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            !selectedCourse
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Subjects
        </button>
        {subjects.map((s) => (
          <button
            key={s.courseCode}
            onClick={() => setSelectedCourse(s.courseCode)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              selectedCourse === s.courseCode
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FiFolder size={14} />
            {s.courseCode}
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs">
              {s.fileCount}
            </span>
          </button>
        ))}
      </div>

      {/* Files grid */}
      {(selectedCourse ? files : (() => {
        // show all files when no subject selected
        const all: StudyFile[] = [];
        for (const s of subjects) {
          all.push(...getFilesByCourse(s.courseCode));
        }
        return all;
      })()).length === 0 ? (
        <EmptyState
          icon={<FiFileText />}
          title="No files uploaded yet"
          subtitle="Files will appear here once teachers upload them."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(selectedCourse
            ? files
            : subjects.flatMap((s) => getFilesByCourse(s.courseCode))
          ).map((f) => (
            <FileCard
              key={f.id}
              file={f}
              onDelete={(id) => setDeleteTarget(id)}
              onDownload={() =>
                toast.success("Download started (mock)")
              }
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
