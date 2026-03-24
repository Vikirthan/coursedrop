"use client";
// ============================================================
// CourseDrop — Admin: Browse All Materials
// ============================================================

import React, { useEffect, useState } from "react";
import {
  apiDeleteFile,
  apiDeleteFilesByCourse,
  apiGetCourseSharing,
  apiListFiles,
  apiListRequests,
  apiListSubjects,
  apiSetCourseSharing,
  apiUpdateRequest,
} from "@/lib/clientDataApi";
import { StudyFile, Subject, SubjectRequest } from "@/lib/types";
import { SectionHeader, EmptyState } from "@/components/ui";
import FileCard from "@/components/FileCard";
import ConfirmModal from "@/components/ConfirmModal";
import PasswordModal from "@/components/PasswordModal";
import { FiFileText, FiFolder, FiUsers, FiSave, FiLoader, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

interface TeacherOption {
  id: string;
  full_name: string;
  uid: string;
  email: string;
  department: string | null;
  approved: boolean;
}

export default function AdminMaterialsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<SubjectRequest[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [sharedTeacherIds, setSharedTeacherIds] = useState<string[]>([]);
  const [sharingDirty, setSharingDirty] = useState(false);
  const [savingSharing, setSavingSharing] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [deleteFolderLoading, setDeleteFolderLoading] = useState(false);
  const [deleteFolderError, setDeleteFolderError] = useState("");

  const refresh = async () => {
    try {
      const [nextSubjects, nextApprovedRequests, nextFiles] = await Promise.all([
        apiListSubjects(),
        apiListRequests({ status: "approved" }),
        apiListFiles(selectedCourse ?? undefined),
      ]);

      setSubjects(nextSubjects);
      setApprovedRequests(nextApprovedRequests);
      setFiles(nextFiles);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to load materials");
    }
  };

  useEffect(() => {
    void refresh();
  }, [selectedCourse]);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const res = await fetch("/api/admin/teachers");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load teachers");
        }
        const data = (await res.json()) as { teachers?: TeacherOption[] };
        setTeachers(data.teachers ?? []);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to load teachers");
      } finally {
        setLoadingTeachers(false);
      }
    };

    void fetchTeachers();
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setSharedTeacherIds([]);
      setSharingDirty(false);
      return;
    }

    apiGetCourseSharing(selectedCourse)
      .then((ids) => {
        setSharedTeacherIds(ids);
        setSharingDirty(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to load sharing settings");
      });
  }, [selectedCourse]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiDeleteFile(deleteTarget);
      toast.success("File deleted");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const approvedTeachers = teachers.filter((teacher) => teacher.approved);
  const teacherIdByUid = new Map(
    approvedTeachers.map((teacher) => [teacher.uid.trim().toLowerCase(), teacher.id])
  );
  const teacherIdByEmail = new Map(
    approvedTeachers.map((teacher) => [teacher.email.trim().toLowerCase(), teacher.id])
  );
  const teacherNameById = new Map(
    approvedTeachers.map((teacher) => [teacher.id, teacher.full_name])
  );

  const ownerTeacherIds = selectedCourse
    ? Array.from(
        new Set(
          approvedRequests
            .filter((request) => request.courseCode === selectedCourse)
            .map((request) => {
              const teacherId = request.teacherId.trim();
              const teacherIdLower = teacherId.toLowerCase();

              if (teacherNameById.has(teacherId)) {
                return teacherId;
              }

              return (
                teacherIdByUid.get(teacherIdLower) ??
                teacherIdByEmail.get(request.teacherEmail.trim().toLowerCase()) ??
                teacherId
              );
            })
        )
      )
    : [];

  const shareCandidates = approvedTeachers.filter(
    (teacher) => !ownerTeacherIds.includes(teacher.id)
  );

  const handleToggleTeacher = (teacherId: string) => {
    setSharingDirty(true);
    setSharedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSaveSharing = () => {
    if (!selectedCourse) return;

    setSavingSharing(true);
    apiSetCourseSharing(selectedCourse, sharedTeacherIds)
      .then((ids) => {
        setSharedTeacherIds(ids);
        setSharingDirty(false);
        toast.success("Teacher sharing updated");
      })
      .catch((err) => {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Failed to update sharing");
      })
      .finally(() => setSavingSharing(false));
  };

  const handleDeleteFolderClick = () => {
    if (!selectedCourse) {
      toast.error("Select a subject first");
      return;
    }

    const folderId = approvedRequests.find(
      (request) => request.courseCode === selectedCourse && !!request.driveFolderId
    )?.driveFolderId;

    if (!folderId) {
      toast.error("No Drive folder found for this course");
      return;
    }

    setDeleteFolderError("");
    setShowDeleteFolderModal(true);
  };

  const handleDeleteFolderConfirm = async (password: string) => {
    if (!selectedCourse) {
      toast.error("Select a subject first");
      return;
    }

    const folderId = approvedRequests.find(
      (request) => request.courseCode === selectedCourse && !!request.driveFolderId
    )?.driveFolderId;

    if (!folderId) {
      throw new Error("No Drive folder found for this course");
    }

    setDeleteFolderLoading(true);
    setDeleteFolderError("");

    try {
      const res = await fetch("/api/drive/delete-folder", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          asAdmin: true,
          adminPassword: password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete folder");
      }

      await Promise.all([
        apiDeleteFilesByCourse(selectedCourse),
        apiUpdateRequest({ courseCode: selectedCourse, driveFolderId: null }),
      ]);

      setShowDeleteFolderModal(false);
      toast.success("Folder and related course files deleted");
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete folder";
      setDeleteFolderError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setDeleteFolderLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader title="All Study Materials" />

      {/* Subject list */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCourse(null)}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
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
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
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

      {selectedCourse && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <FiUsers /> Sharing for {selectedCourse}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Owners always have access. Select additional approved teachers who can view and upload files.
              </p>
            </div>
            <button
              onClick={handleSaveSharing}
              disabled={!sharingDirty || savingSharing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {savingSharing ? <FiLoader className="animate-spin" /> : <FiSave />}
              Save Sharing
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={handleDeleteFolderClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 sm:w-auto"
            >
              <FiTrash2 /> Delete Whole Folder (Admin)
            </button>
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Owners:</span>{" "}
            {ownerTeacherIds.length === 0
              ? "No owner detected"
              : ownerTeacherIds
                  .map((teacherId) => teacherNameById.get(teacherId) ?? teacherId)
                  .join(", ")}
          </div>

          {loadingTeachers ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiLoader className="animate-spin" /> Loading teachers...
            </div>
          ) : shareCandidates.length === 0 ? (
            <p className="text-sm text-slate-500">
              No additional approved teachers available to share with.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {shareCandidates.map((teacher) => {
                const checked = sharedTeacherIds.includes(teacher.id);
                return (
                  <label
                    key={teacher.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                      checked
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleTeacher(teacher.id)}
                      className="mt-0.5 h-4 w-4 accent-indigo-600"
                    />
                    <span>
                      <span className="block font-semibold text-slate-700">
                        {teacher.full_name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        UID: {teacher.uid} · {teacher.department ?? "No department"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Files grid */}
      {files.length === 0 ? (
        <EmptyState
          icon={<FiFileText />}
          title="No files uploaded yet"
          subtitle="Files will appear here once teachers upload them."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
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

      <PasswordModal
        isOpen={showDeleteFolderModal}
        title="Admin Folder Deletion"
        description="Enter admin password to delete the full Drive folder and clear course files from the portal."
        onConfirm={handleDeleteFolderConfirm}
        onCancel={() => {
          setShowDeleteFolderModal(false);
          setDeleteFolderError("");
        }}
        isLoading={deleteFolderLoading}
        error={deleteFolderError}
      />
    </div>
  );
}
