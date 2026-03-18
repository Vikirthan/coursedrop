"use client";
// ============================================================
// CourseDrop — Drag & Drop Upload Component
// ============================================================

import React, { useCallback, useRef, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { isAllowedFile, ALLOWED_EXTENSIONS } from "@/lib/utils";
import toast from "react-hot-toast";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploading?: boolean;
}

export default function UploadZone({ onFilesSelected, uploading }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const valid: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (isAllowedFile(f.name)) {
          valid.push(f);
        } else {
          toast.error(`"${f.name}" is not an allowed file type.`);
        }
      }
      if (valid.length) onFilesSelected(valid);
    },
    [onFilesSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
        dragActive
          ? "border-indigo-400 bg-indigo-50"
          : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
      } ${uploading ? "pointer-events-none opacity-50" : ""}`}
    >
      <FiUploadCloud className="mb-3 text-indigo-400" size={40} />
      <p className="font-semibold text-slate-700">
        {uploading ? "Uploading…" : "Drag & drop files here"}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        or click to browse &middot; Allowed: {ALLOWED_EXTENSIONS.join(", ").toUpperCase()}
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
