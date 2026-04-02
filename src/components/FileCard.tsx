"use client";
// ============================================================
// CourseDrop — File Card Component
// ============================================================

import React from "react";
import { StudyFile } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileTypeIcon } from "./ui";
import { FiDownload, FiTrash2 } from "react-icons/fi";

interface FileCardProps {
  file: StudyFile;
  serialNumber?: number;
  selectable?: boolean;
  selected?: boolean;
  deleting?: boolean;
  showUploader?: boolean;
  showSection?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDownload?: (file: StudyFile) => void;
}

export default function FileCard({
  file,
  serialNumber,
  selectable,
  selected,
  deleting = false,
  showUploader = false,
  showSection = false,
  onSelect,
  onDelete,
  onDownload,
}: FileCardProps) {
  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        selected ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
      }`}
    >
      {typeof serialNumber === "number" && (
        <div className="absolute left-3 top-3 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          #{serialNumber}
        </div>
      )}

      {/* select checkbox */}
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect?.(file.id)}
          className="absolute right-3 top-3 h-4 w-4 accent-indigo-600"
        />
      )}

      <div className="flex items-start gap-3 pt-5">
        <div className="mt-0.5 shrink-0">
          <FileTypeIcon ext={file.type} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800" title={file.name}>
            {file.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {formatBytes(file.size)} &middot; {formatDate(file.uploadDate)}
          </p>
          {showSection && file.section && (
            <p className="mt-1 text-xs font-semibold text-indigo-600">
              Section: {file.section}
            </p>
          )}
          {showUploader && (
            <p className="mt-1 text-xs text-slate-500">
              Uploaded by: {file.uploadedByName}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onDownload?.(file)}
          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
        >
          <FiDownload size={14} /> Download
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(file.id)}
            disabled={deleting}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiTrash2 size={14} /> {deleting ? "Removing..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
