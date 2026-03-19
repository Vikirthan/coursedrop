// ============================================================
// API: POST /api/drive/upload — Upload file to Drive
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  createSubjectFolder,
  deleteFileFromDrive,
  uploadFileToDrive,
  type UploadResult,
} from "@/lib/drive";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { StudyFile } from "@/lib/types";

type StudyFileRow = {
  id: string;
  name: string;
  type: string;
  size: number;
  section: string | null;
  course_code: string;
  subject_name: string;
  uploaded_by: string;
  uploaded_by_name: string;
  upload_date: string;
  drive_file_id: string;
  drive_download_url: string;
  drive_thumbnail_url: string | null;
};

const FILE_SELECT_COLUMNS =
  "id,name,type,size,section,course_code,subject_name,uploaded_by,uploaded_by_name,upload_date,drive_file_id,drive_download_url,drive_thumbnail_url";

function toStudyFile(row: StudyFileRow): StudyFile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size,
    section: row.section ?? undefined,
    courseCode: row.course_code,
    subjectName: row.subject_name,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name,
    uploadDate: row.upload_date,
    driveFileId: row.drive_file_id,
    driveDownloadUrl: row.drive_download_url,
    driveThumbnailUrl: row.drive_thumbnail_url ?? undefined,
  };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  if (err && typeof err === "object") {
    const maybe = err as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [maybe.message, maybe.details, maybe.hint].filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    );

    if (parts.length > 0) {
      return parts.join(" ");
    }

    if (typeof maybe.code === "string" && maybe.code.trim()) {
      return `Supabase error (${maybe.code})`;
    }
  }

  return "Unknown error";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const courseCode = formData.get("courseCode") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const uploadedBy = formData.get("uploadedBy") as string | null;
    const uploadedByName = formData.get("uploadedByName") as string | null;
    const subjectName = formData.get("subjectName") as string | null;
    const section = formData.get("section") as string | null;
    const normalizedCourseCode = (courseCode ?? "").trim().toUpperCase();

    if (!file || !normalizedCourseCode) {
      return NextResponse.json(
        { error: "file and courseCode are required" },
        { status: 400 }
      );
    }

    const resolvedSubjectName = subjectName?.trim() || normalizedCourseCode;
    let targetFolderId =
      folderId && folderId.trim().length > 0
        ? folderId
        : await createSubjectFolder(resolvedSubjectName, normalizedCourseCode);

    const buffer = Buffer.from(await file.arrayBuffer());
    const shouldRetryWithSharedFolder = (message: string): boolean =>
      /Service Accounts do not have storage quota|cannot store files in My Drive|File not found|notFound/i.test(
        message
      );

    let result: UploadResult;
    try {
      result = await uploadFileToDrive(
        targetFolderId,
        file.name,
        file.type || "application/octet-stream",
        buffer
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";

      // Auto-heal requests that still point to an old/non-shared folder ID.
      if (folderId && shouldRetryWithSharedFolder(message)) {
        targetFolderId = await createSubjectFolder(
          resolvedSubjectName,
          normalizedCourseCode
        );
        result = await uploadFileToDrive(
          targetFolderId,
          file.name,
          file.type || "application/octet-stream",
          buffer
        );
      } else {
        throw err;
      }
    }

    // Persist metadata server-side so uploads are visible across all devices immediately.
    const nowIso = new Date().toISOString();
    const normalizedType =
      file.name.split(".").pop()?.trim().toLowerCase() ||
      file.type.trim().toLowerCase() ||
      "file";

    const supabase = getSupabaseAdminClient();
    const { data: existingRows, error: existingError } = await supabase
      .from("study_files")
      .select(FILE_SELECT_COLUMNS)
      .eq("drive_file_id", result.fileId)
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    let savedRow = (existingRows ?? [])[0] as StudyFileRow | undefined;

    if (!savedRow) {
      const rowToInsert = {
        id: `file-${crypto.randomUUID()}`,
        name: file.name,
        type: normalizedType,
        size: file.size,
        section: section?.trim() || null,
        course_code: normalizedCourseCode,
        subject_name: resolvedSubjectName,
        uploaded_by: uploadedBy?.trim() || "unknown",
        uploaded_by_name: uploadedByName?.trim() || "Unknown",
        upload_date: nowIso,
        drive_file_id: result.fileId,
        drive_download_url: result.downloadUrl,
        drive_thumbnail_url: null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("study_files")
        .insert(rowToInsert)
        .select(FILE_SELECT_COLUMNS)
        .single();

      if (insertError) {
        try {
          await deleteFileFromDrive(result.fileId);
        } catch (rollbackErr) {
          console.error(
            "[drive/upload] Failed to rollback Drive file after DB insert error:",
            rollbackErr
          );
        }

        throw new Error(
          `Upload saved to Drive but metadata save failed: ${getErrorMessage(insertError)}`
        );
      }

      savedRow = inserted as StudyFileRow;
    }

    if (!savedRow) {
      throw new Error("Failed to load uploaded file metadata");
    }

    return NextResponse.json({
      file: toStudyFile(savedRow),
      folderIdUsed: targetFolderId,
      persistedAt: nowIso,
      source: "server",
      live: true,
    });
  } catch (err: unknown) {
    console.error("[drive/upload] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
