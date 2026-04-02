"use client";
// ============================================================
// CourseDrop — Teacher: Upload Files to Approved Subjects
// (Real Google Drive integration)
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  apiDeleteFile,
  apiDeleteFilesByCourse,
  apiGetTeacherSharedCourses,
  apiListFiles,
  apiListRequests,
  apiUpdateRequest,
} from "@/lib/clientDataApi";
import { StudyFile, SubjectRequest } from "@/lib/types";
import { SectionHeader, EmptyState } from "@/components/ui";
import UploadZone from "@/components/UploadZone";
import FileCard from "@/components/FileCard";
import PasswordModal from "@/components/PasswordModal";
import ConfirmModal from "@/components/ConfirmModal";
import { FiFolder, FiLock, FiLoader, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

interface UploadProgressState {
  totalFiles: number;
  completedFiles: number;
  currentFileName: string;
  currentFileProgress: number;
  overallProgress: number;
  etaSeconds: number | null;
}

type UploadApiResponse = {
  file: StudyFile;
  folderIdUsed?: string;
  duplicate?: boolean;
};

interface FailedUpload {
  file: File;
  reason: string;
}

function formatEta(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return "calculating...";
  }

  if (seconds < 60) {
    return "Less than a minute";
  }

  const mins = Math.round(seconds / 60);
  if (mins === 1) {
    return "About a minute";
  }
  if (mins < 60) {
    return `About ${mins} minutes`;
  }

  const hours = Math.round(mins / 60);
  if (hours === 1) {
    return "About an hour";
  }
  return `About ${hours} hours`;
}

function toPercent(loaded: number, total: number): number {
  if (total <= 0) return 0;
  const raw = Math.round((loaded / total) * 100);
  return Math.max(0, Math.min(raw, 100));
}

function getFileSignature(name: string, size: number): string {
  return `${name.trim().toLowerCase()}::${size}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRetryableUploadError(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("429") ||
    normalized.includes("502") ||
    normalized.includes("503") ||
    normalized.includes("504")
  );
}

export default function TeacherUploadPage() {
  const { user } = useAuth();
  const [allApprovedRequests, setAllApprovedRequests] = useState<SubjectRequest[]>([]);
  const [subjects, setSubjects] = useState<SubjectRequest[]>([]);
  const [ownedCourseCodes, setOwnedCourseCodes] = useState<string[]>([]);
  const [shareOnlyCourseCodes, setShareOnlyCourseCodes] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [section, setSection] = useState("");
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteFolderLoading, setDeleteFolderLoading] = useState(false);
  const [deleteFolderError, setDeleteFolderError] = useState("");
  const activeUploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const cancelUploadRef = useRef(false);

  const refresh = useCallback(async (showError = true, forceSync = false) => {
    if (!user) return;

    const teacherKeys = Array.from(
      new Set([user.id, user.username].map((value) => value?.trim()).filter(Boolean))
    ) as string[];
    const teacherKeySet = new Set(teacherKeys);
    const teacherEmails = Array.from(
      new Set([user.email].map((value) => value?.trim().toLowerCase()).filter(Boolean))
    ) as string[];
    const teacherEmailSet = new Set(teacherEmails);

    try {
      const [approvedRequests, sharedCourseCodes] = await Promise.all([
        apiListRequests({ status: "approved" }),
        apiGetTeacherSharedCourses(user.id, user.username, user.email),
      ]);

      const activeApprovedRequests = approvedRequests.filter(
        (request) => (request.driveFolderId ?? "").trim().length > 0
      );

      setAllApprovedRequests(activeApprovedRequests);
      setShareOnlyCourseCodes(
        Array.from(
          new Set(
            activeApprovedRequests
              .filter((request) => request.teacherId.trim().toLowerCase() === "admin")
              .map((request) => request.courseCode)
          )
        )
      );

      const ownedCourseSet = new Set<string>();
      const accessibleByCourse = new Map<string, SubjectRequest>();

      for (const request of activeApprovedRequests) {
        if (
          teacherKeySet.has(request.teacherId) ||
          teacherEmailSet.has(request.teacherEmail.trim().toLowerCase())
        ) {
          ownedCourseSet.add(request.courseCode);
          if (!accessibleByCourse.has(request.courseCode)) {
            accessibleByCourse.set(request.courseCode, request);
          }
        }
      }

      for (const courseCode of sharedCourseCodes) {
        if (accessibleByCourse.has(courseCode)) {
          continue;
        }
        const match = activeApprovedRequests.find((request) => request.courseCode === courseCode);
        if (match) {
          accessibleByCourse.set(courseCode, match);
        }
      }

      const accessibleSubjects = Array.from(accessibleByCourse.values());
      setOwnedCourseCodes(Array.from(ownedCourseSet));
      setSubjects(accessibleSubjects);

      if (selectedCourse) {
        const stillAccessible = accessibleSubjects.some(
          (subject) => subject.courseCode === selectedCourse
        );
        if (!stillAccessible) {
          setSelectedCourse(null);
          setFiles([]);
          setSelectedFileIds(new Set());
        } else {
          const nextFiles = await apiListFiles(selectedCourse, {
            forceSync,
          });
          setFiles(nextFiles);
          setSelectedFileIds((prev) => {
            const nextIds = new Set(nextFiles.map((file) => file.id));
            return new Set(Array.from(prev).filter((id) => nextIds.has(id)));
          });
        }
      }
    } catch (err) {
      console.error(err);
      if (showError) {
        toast.error(err instanceof Error ? err.message : "Failed to load upload data");
      }
    }
  }, [user, selectedCourse]);

  useEffect(() => {
    void refresh(true, true);
  }, [refresh, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const tick = () => {
      void refresh(false, false);
    };

    const intervalId = window.setInterval(tick, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh(false, true);
      }
    };

    const handleFocus = () => {
      void refresh(false, true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  const getFolderIdForCourse = (courseCode: string): string | undefined =>
    allApprovedRequests.find(
      (request) => request.courseCode === courseCode && !!request.driveFolderId
    )?.driveFolderId;

  const uploadFileWithProgress = (
    formData: FormData,
    onProgress: (loadedBytes: number) => void
  ): Promise<UploadApiResponse> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      activeUploadXhrRef.current = xhr;
      xhr.open("POST", "/api/drive/upload");
      xhr.responseType = "json";

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded);
        }
      };

      xhr.onload = () => {
        activeUploadXhrRef.current = null;

        const body: unknown =
          xhr.response && typeof xhr.response === "object"
            ? xhr.response
            : (() => {
                try {
                  return JSON.parse(xhr.responseText) as unknown;
                } catch {
                  return null;
                }
              })();

        if (
          xhr.status >= 200 &&
          xhr.status < 300 &&
          body &&
          typeof body === "object" &&
          "file" in body
        ) {
          resolve(body as UploadApiResponse);
          return;
        }

        const error =
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error?: unknown }).error === "string"
            ? (body as { error: string }).error
            : "Upload failed";
        reject(new Error(error));
      };

      xhr.onerror = () => {
        activeUploadXhrRef.current = null;
        reject(new Error("Network error during upload"));
      };

      xhr.onabort = () => {
        activeUploadXhrRef.current = null;
        reject(new Error("Upload cancelled"));
      };

      xhr.send(formData);
    });

  const handleCancelUpload = () => {
    cancelUploadRef.current = true;
    activeUploadXhrRef.current?.abort();
  };

  const handleUpload = async (fileList: File[]) => {
    if (!selectedCourse || !user || uploading) return;

    if (shareOnlyCourseCodes.includes(selectedCourse)) {
      toast.error("This folder is share-only. Upload is disabled by admin.");
      return;
    }

    const normalizedSection = section.trim();
    const folderId = getFolderIdForCourse(selectedCourse);

    const existingSignatures = new Set(
      files.map((file) => getFileSignature(file.name, file.size))
    );
    const queuedSignatures = new Set<string>();
    const duplicateNames: string[] = [];
    const uploadQueue: File[] = [];

    for (const candidate of fileList) {
      const sig = getFileSignature(candidate.name, candidate.size);
      if (existingSignatures.has(sig) || queuedSignatures.has(sig)) {
        duplicateNames.push(candidate.name);
        continue;
      }
      queuedSignatures.add(sig);
      uploadQueue.push(candidate);
    }

    if (duplicateNames.length > 0) {
      toast.error(
        `${duplicateNames.length} duplicate file(s) skipped (same name and size).`
      );
    }

    if (uploadQueue.length === 0) {
      return;
    }

    setUploading(true);
    setFailedUploads([]);
    cancelUploadRef.current = false;
    let uploaded = 0;
    let cancelled = false;
    const nextFailedUploads: FailedUpload[] = [];
    const expectedVisibleSignatures = new Set<string>();

    const currentSubject = subjects.find((s) => s.courseCode === selectedCourse);
    let effectiveFolderId = folderId;
    const totalBytes = uploadQueue.reduce((sum, f) => sum + f.size, 0);
    const uploadStartedAt = Date.now();
    let completedBytes = 0;

    setUploadProgress({
      totalFiles: uploadQueue.length,
      completedFiles: 0,
      currentFileName: uploadQueue[0]?.name ?? "",
      currentFileProgress: 0,
      overallProgress: 0,
      etaSeconds: null,
    });

    for (let i = 0; i < uploadQueue.length; i++) {
      if (cancelUploadRef.current) {
        cancelled = true;
        for (let j = i; j < uploadQueue.length; j++) {
          nextFailedUploads.push({
            file: uploadQueue[j],
            reason: "Upload cancelled",
          });
        }
        break;
      }

      const f = uploadQueue[i];
      try {
        setUploadProgress((prev) => ({
          totalFiles: prev?.totalFiles ?? uploadQueue.length,
          completedFiles: i,
          currentFileName: f.name,
          currentFileProgress: 0,
          overallProgress: toPercent(completedBytes, totalBytes),
          etaSeconds: prev?.etaSeconds ?? null,
        }));

        const formData = new FormData();
        formData.append("file", f);
        formData.append("courseCode", selectedCourse);
        if (effectiveFolderId) {
          formData.append("folderId", effectiveFolderId);
        }
        formData.append("uploadedBy", user.id);
        formData.append("uploadedByName", user.name);
        formData.append("subjectName", currentSubject?.subjectName ?? selectedCourse);
        if (normalizedSection) {
          formData.append("section", normalizedSection);
        }

        let data: UploadApiResponse | null = null;
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            data = await uploadFileWithProgress(formData, (loadedBytes) => {
              const cappedLoadedBytes = Math.min(Math.max(loadedBytes, 0), f.size);
              const uploadedBytes = completedBytes + cappedLoadedBytes;
              const elapsedSeconds = Math.max((Date.now() - uploadStartedAt) / 1000, 0.1);
              const bytesPerSecond = uploadedBytes / elapsedSeconds;
              const remainingBytes = Math.max(totalBytes - uploadedBytes, 0);
              const etaSeconds =
                bytesPerSecond > 0 ? Math.ceil(remainingBytes / bytesPerSecond) : null;

              setUploadProgress({
                totalFiles: uploadQueue.length,
                completedFiles: i,
                currentFileName: f.name,
                currentFileProgress: toPercent(cappedLoadedBytes, f.size),
                overallProgress: toPercent(uploadedBytes, totalBytes),
                etaSeconds,
              });
            });
            break;
          } catch (attemptErr) {
            lastError = attemptErr;
            const message =
              attemptErr instanceof Error ? attemptErr.message : "Upload failed";
            if (attempt >= 3 || !isRetryableUploadError(message)) {
              break;
            }
            await sleep(400 * attempt);
          }
        }

        if (!data) {
          throw (lastError instanceof Error ? lastError : new Error("Upload failed"));
        }

        completedBytes += f.size;

        if (data.folderIdUsed && data.folderIdUsed !== effectiveFolderId) {
          effectiveFolderId = data.folderIdUsed;
          await apiUpdateRequest({
            courseCode: selectedCourse,
            driveFolderId: data.folderIdUsed,
          });
        }

        if (data.duplicate) {
          expectedVisibleSignatures.add(getFileSignature(f.name, f.size));
          continue;
        }

        // Metadata is now persisted atomically by /api/drive/upload.
        uploaded++;
        expectedVisibleSignatures.add(getFileSignature(f.name, f.size));
        setFiles((prev) => {
          const exists = prev.some(
            (file) => getFileSignature(file.name, file.size) === getFileSignature(data.file.name, data.file.size)
          );
          if (exists) {
            return prev;
          }
          return [data.file, ...prev];
        });

        setUploadProgress({
          totalFiles: uploadQueue.length,
          completedFiles: i + 1,
          currentFileName: f.name,
          currentFileProgress: 100,
          overallProgress: toPercent(completedBytes, totalBytes),
          etaSeconds:
            i + 1 === uploadQueue.length
              ? 0
              : Math.ceil(
                  Math.max(
                    (totalBytes - completedBytes) /
                      Math.max(completedBytes / Math.max((Date.now() - uploadStartedAt) / 1000, 0.1), 1),
                    0
                  )
                ),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to upload ${f.name}`;
        if (err instanceof Error && err.message === "Upload cancelled") {
          cancelled = true;
          nextFailedUploads.push({ file: f, reason: message });
          for (let j = i + 1; j < uploadQueue.length; j++) {
            nextFailedUploads.push({
              file: uploadQueue[j],
              reason: "Upload cancelled",
            });
          }
          break;
        }
        console.error(`Upload failed for ${f.name}:`, err);
        nextFailedUploads.push({ file: f, reason: message });
      }
    }

    if (cancelled) {
      toast.error("Upload cancelled.");
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} file(s) uploaded to Google Drive!`);
    }

    if (nextFailedUploads.length > 0) {
      setFailedUploads(nextFailedUploads);
      const failedNames = nextFailedUploads.map((entry) => entry.file.name).join(", ");
      toast.error(`Failed uploads: ${failedNames}`);
    }

    setUploadProgress(null);
    activeUploadXhrRef.current = null;
    setUploading(false);

    if (selectedCourse && expectedVisibleSignatures.size > 0) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const latestFiles = await apiListFiles(selectedCourse, {
          forceSync: true,
        });
        setFiles(latestFiles);
        setSelectedFileIds((prev) => {
          const nextIds = new Set(latestFiles.map((file) => file.id));
          return new Set(Array.from(prev).filter((id) => nextIds.has(id)));
        });

        const latestSignatures = new Set(
          latestFiles.map((file) => getFileSignature(file.name, file.size))
        );
        const missing = Array.from(expectedVisibleSignatures).filter(
          (sig) => !latestSignatures.has(sig)
        );
        if (missing.length === 0) {
          break;
        }
        await sleep(800);
      }
    }

    await refresh(false, true);
  };

  const handleRetryFailed = () => {
    if (failedUploads.length === 0 || uploading) {
      return;
    }
    void handleUpload(failedUploads.map((entry) => entry.file));
  };

  const handleDownload = (file: StudyFile) => {
    window.open(`/api/drive/download?fileId=${file.driveFileId}`, "_blank");
  };

  const handleSelectFile = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiles = () => {
    const deletableIds = files
      .filter((f) => f.uploadedBy === user?.id || ownedCourseCodes.includes(f.courseCode))
      .map((f) => f.id);

    if (deletableIds.length === 0) {
      return;
    }

    const allSelected = deletableIds.every((id) => selectedFileIds.has(id));
    if (allSelected) {
      setSelectedFileIds(new Set());
      return;
    }

    setSelectedFileIds(new Set(deletableIds));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const file = files.find((f) => f.id === deleteTarget);
    const canDelete =
      !!file &&
      !!user &&
      (file.uploadedBy === user.id || ownedCourseCodes.includes(file.courseCode));

    if (!canDelete) {
      toast.error("You can only delete your own files unless you own the subject.");
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }

    try {
      // Delete from Google Drive
      if (file && file.driveFileId) {
        const res = await fetch(`/api/drive/delete?fileId=${file.driveFileId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Delete failed");
        }
      }

      // Delete from local store
      await apiDeleteFile(deleteTarget);
      toast.success("File deleted from Drive");
      setDeleteTarget(null);
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget);
        return next;
      });
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedFileIds.size === 0 || !user) {
      setShowBatchDeleteConfirm(false);
      return;
    }

    setDeleting(true);

    const selectedFiles = files.filter((file) => selectedFileIds.has(file.id));
    const deletableFiles = selectedFiles.filter(
      (file) => file.uploadedBy === user.id || ownedCourseCodes.includes(file.courseCode)
    );
    const blockedFiles = selectedFiles.filter(
      (file) => !(file.uploadedBy === user.id || ownedCourseCodes.includes(file.courseCode))
    );

    let deletedCount = 0;
    const failedNames: string[] = [];

    for (const file of deletableFiles) {
      try {
        if (file.driveFileId) {
          const res = await fetch(`/api/drive/delete?fileId=${file.driveFileId}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Delete failed");
          }
        }

        await apiDeleteFile(file.id);
        deletedCount++;
      } catch {
        failedNames.push(file.name);
      }
    }

    if (deletedCount > 0) {
      toast.success(`${deletedCount} file(s) deleted`);
    }
    if (blockedFiles.length > 0) {
      toast.error(`${blockedFiles.length} file(s) skipped (no permission)`);
    }
    if (failedNames.length > 0) {
      toast.error(`Failed to delete: ${failedNames.join(", ")}`);
    }

    setSelectedFileIds(new Set());
    setShowBatchDeleteConfirm(false);
    setDeleting(false);
    await refresh(false, true);
  };

  const handleDeleteFolderClick = () => {
    if (!selectedCourse) {
      toast.error("Please select a subject first");
      return;
    }
    if (!ownedCourseCodes.includes(selectedCourse)) {
      toast.error("Only the subject owner can delete this folder.");
      return;
    }
    setShowPasswordModal(true);
    setDeleteFolderError("");
  };

  const handleDeleteFolderConfirm = async (password: string) => {
    if (!selectedCourse || !user) {
      toast.error("Invalid selection");
      return;
    }

    if (!ownedCourseCodes.includes(selectedCourse)) {
      toast.error("Only the subject owner can delete this folder.");
      return;
    }

    const folderId = getFolderIdForCourse(selectedCourse);
    if (!folderId) {
      toast.error("No folder to delete");
      setShowPasswordModal(false);
      return;
    }

    setDeleteFolderLoading(true);
    setDeleteFolderError("");

    try {
      const res = await fetch("/api/drive/delete-folder", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          teacherId: user.id,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete folder");
      }

      await Promise.all([
        apiDeleteFilesByCourse(selectedCourse),
        apiUpdateRequest({ courseCode: selectedCourse, driveFolderId: null }),
      ]);

      toast.success("Folder and all contents deleted successfully");
      setShowPasswordModal(false);
      setSelectedCourse(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setDeleteFolderError(message);
    } finally {
      setDeleteFolderLoading(false);
    }
  };

  if (!subjects || subjects.length === 0) {
    return (
      <div>
        <SectionHeader title="Upload Materials" />
        <EmptyState
          icon={<FiLock />}
          title="No approved subjects yet"
          subtitle="Submit a subject request and wait for admin approval before uploading."
        />
      </div>
    );
  }

  const isOwnedSelectedCourse =
    !!selectedCourse && ownedCourseCodes.includes(selectedCourse);
  const isShareOnlySelectedCourse =
    !!selectedCourse && shareOnlyCourseCodes.includes(selectedCourse);

  return (
    <div>
      <SectionHeader title="Upload Materials" />

      {/* Course selector */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s.courseCode}
              onClick={() => setSelectedCourse(s.courseCode)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                selectedCourse === s.courseCode
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <FiFolder size={14} />
              <span className="max-w-[170px] truncate sm:max-w-[260px]">{s.subjectName} ({s.courseCode})</span>
              {!ownedCourseCodes.includes(s.courseCode) && (
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                  {shareOnlyCourseCodes.includes(s.courseCode) ? "View Only" : "Shared"}
                </span>
              )}
            </button>
          ))}
        </div>

        {selectedCourse && isOwnedSelectedCourse && (
          <button
            onClick={handleDeleteFolderClick}
            className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
          >
            <FiTrash2 size={16} />
            Delete Folder
          </button>
        )}
      </div>

      {selectedCourse && !isOwnedSelectedCourse && (
        <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700">
          {isShareOnlySelectedCourse
            ? "Shared access: this course is view-only. Upload is disabled by admin for this shared folder."
            : "Shared access: you can upload and view files for this subject, but folder deletion is restricted to the owner."}
        </p>
      )}

      {!selectedCourse ? (
        <EmptyState
          icon={<FiFolder />}
          title="Select a subject"
          subtitle="Choose an approved subject above to upload or view files."
        />
      ) : (
        <>
          {!isShareOnlySelectedCourse && (
            <>
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Section (optional, recommended)
                </label>
                <input
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. A, B, Morning Batch"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Students will see this near files to avoid confusion across parallel sections.
                </p>
              </div>

              {/* Upload zone */}
              <div className="mb-6">
                <UploadZone onFilesSelected={handleUpload} uploading={uploading} />

                {failedUploads.length > 0 && !uploading && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      {failedUploads.length} file(s) failed. Retry from here.
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      {failedUploads.map((entry) => entry.file.name).join(", ")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={handleRetryFailed}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Retry Failed Uploads
                      </button>
                      <button
                        onClick={() => setFailedUploads([])}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        Clear Failed List
                      </button>
                    </div>
                  </div>
                )}

                {uploading && uploadProgress && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                        <FiLoader className="animate-spin text-indigo-500" />
                        <span className="truncate">
                          Uploading {Math.min(uploadProgress.completedFiles + 1, uploadProgress.totalFiles)}/
                          {uploadProgress.totalFiles}: {uploadProgress.currentFileName}
                        </span>
                      </div>

                      <button
                        onClick={handleCancelUpload}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Cancel Upload
                      </button>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.min(uploadProgress.overallProgress, 100)}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Overall {uploadProgress.overallProgress}% · Current file {uploadProgress.currentFileProgress}% · ETA {formatEta(uploadProgress.etaSeconds)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Existing files */}
          <SectionHeader title={`Files in ${selectedCourse}`} />
          {files.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={handleSelectAllFiles}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                {files
                  .filter(
                    (f) => f.uploadedBy === user?.id || ownedCourseCodes.includes(f.courseCode)
                  )
                  .every((f) => selectedFileIds.has(f.id))
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                onClick={() => setShowBatchDeleteConfirm(true)}
                disabled={selectedFileIds.size === 0 || deleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Selected ({selectedFileIds.size})
              </button>
            </div>
          )}
          {files.length === 0 ? (
            <EmptyState title="No files yet" subtitle="Upload your first file above." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((f, index) => (
                <FileCard
                  key={f.id}
                  file={f}
                  serialNumber={index + 1}
                  selectable={f.uploadedBy === user?.id || ownedCourseCodes.includes(f.courseCode)}
                  selected={selectedFileIds.has(f.id)}
                  onSelect={handleSelectFile}
                  onDelete={
                    f.uploadedBy === user?.id || ownedCourseCodes.includes(f.courseCode)
                      ? (id) => setDeleteTarget(id)
                      : undefined
                  }
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete File"
        message="Are you sure you want to delete this file? It will also be removed from Google Drive."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        open={showBatchDeleteConfirm}
        title="Delete Selected Files"
        message={`Are you sure you want to delete ${selectedFileIds.size} selected file(s)? This will remove them from Google Drive too.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Selected"}
        danger
        onConfirm={handleBatchDelete}
        onCancel={() => setShowBatchDeleteConfirm(false)}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        title="Delete Subject Folder"
        description="Confirm with your password to delete this subject folder and all its contents from Google Drive. This action cannot be undone."
        onConfirm={handleDeleteFolderConfirm}
        onCancel={() => {
          setShowPasswordModal(false);
          setDeleteFolderError("");
        }}
        isLoading={deleteFolderLoading}
        error={deleteFolderError}
      />
    </div>
  );
}
