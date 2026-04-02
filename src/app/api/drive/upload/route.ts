// ============================================================
// API: POST /api/drive/upload — Upload file to Drive
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { forbiddenJson, getSessionUserFromRequest, unauthorizedJson } from "@/lib/apiAuth";
import {
  createSubjectFolder,
  deleteFileFromDrive,
  listFilesInFolder,
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

function buildDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
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
    const overwrite = String(formData.get("overwrite") ?? "").trim().toLowerCase();
    const shouldOverwrite = overwrite === "1" || overwrite === "true" || overwrite === "yes";
    const normalizedCourseCode = (courseCode ?? "").trim().toUpperCase();

    if (!file || !normalizedCourseCode) {
      return NextResponse.json(
        { error: "file and courseCode are required" },
        { status: 400 }
      );
    }

    const sessionUser = getSessionUserFromRequest(req);
    if (!sessionUser) {
      return unauthorizedJson("Please sign in");
    }

    if (sessionUser.role !== "teacher" && sessionUser.role !== "admin") {
      return forbiddenJson("Only teachers or admin can upload files");
    }

    const supabase = getSupabaseAdminClient();
    const requesterTokens = new Set(
      [
        sessionUser.id,
        sessionUser.username,
        sessionUser.email,
      ]
        .map((value) => (value ?? "").trim().toLowerCase())
        .filter((value) => value.length > 0)
    );

    const { data: approvedRows, error: approvedRowsError } = await supabase
      .from("subject_requests")
      .select("teacher_id,teacher_email")
      .ilike("course_code", normalizedCourseCode)
      .eq("status", "approved");

    if (approvedRowsError) {
      throw approvedRowsError;
    }

    const hasAdminOwnedApproval = (approvedRows ?? []).some((row) => {
      const teacherId = String((row as { teacher_id?: unknown }).teacher_id ?? "")
        .trim()
        .toLowerCase();
      return teacherId === "admin";
    });

    const ownsCourse = (approvedRows ?? []).some((row) => {
      const teacherId = String((row as { teacher_id?: unknown }).teacher_id ?? "")
        .trim()
        .toLowerCase();
      const teacherEmail = String((row as { teacher_email?: unknown }).teacher_email ?? "")
        .trim()
        .toLowerCase();
      return requesterTokens.has(teacherId) || requesterTokens.has(teacherEmail);
    });

    let hasSharedAccess = false;
    if (!ownsCourse && sessionUser.role === "teacher") {
      const sharingResult = await supabase
        .from("course_sharing")
        .select("teacher_ids")
        .ilike("course_code", normalizedCourseCode)
        .maybeSingle();

      if (sharingResult.error && sharingResult.error.code !== "PGRST116") {
        throw sharingResult.error;
      }

      const teacherIds: string[] =
        (sharingResult.data?.teacher_ids ?? [])
          .map((value: unknown) => String(value).trim().toLowerCase())
          .filter((value: string) => value.length > 0) ?? [];
      hasSharedAccess = teacherIds.some((id) => requesterTokens.has(id));
    }

    if (sessionUser.role !== "admin" && !ownsCourse && !hasSharedAccess) {
      return forbiddenJson("You do not have upload access for this course");
    }

    if (sessionUser.role === "teacher" && hasAdminOwnedApproval) {
      return forbiddenJson("This folder is share-only. Upload is disabled by admin.");
    }

    const resolvedSubjectName = subjectName?.trim() || normalizedCourseCode;

    const { data: potentialDuplicates, error: duplicateQueryError } = await supabase
      .from("study_files")
      .select(FILE_SELECT_COLUMNS)
      .ilike("course_code", normalizedCourseCode)
      .eq("size", file.size)
      .limit(50);

    if (duplicateQueryError) {
      throw duplicateQueryError;
    }

    const { data: sameNameRows, error: sameNameQueryError } = await supabase
      .from("study_files")
      .select(FILE_SELECT_COLUMNS)
      .ilike("course_code", normalizedCourseCode)
      .ilike("name", file.name)
      .limit(50);

    if (sameNameQueryError) {
      throw sameNameQueryError;
    }

    const normalizedIncomingName = file.name.trim().toLowerCase();
    const duplicateRow = (potentialDuplicates ?? []).find((row) => {
      const candidate = row as StudyFileRow;
      return candidate.name.trim().toLowerCase() === normalizedIncomingName;
    }) as StudyFileRow | undefined;

    const sameNameRow = (sameNameRows ?? []).find((row) => {
      const candidate = row as StudyFileRow;
      return candidate.name.trim().toLowerCase() === normalizedIncomingName;
    }) as StudyFileRow | undefined;

    if (duplicateRow && !shouldOverwrite) {
      return NextResponse.json({
        file: toStudyFile(duplicateRow),
        duplicate: true,
        skipped: true,
      });
    }

    const existingRowToReplace = sameNameRow ?? duplicateRow ?? undefined;

    let targetFolderId =
      folderId && folderId.trim().length > 0
        ? folderId
        : await createSubjectFolder(resolvedSubjectName, normalizedCourseCode);

    const folderFiles = await listFilesInFolder(targetFolderId);
    const matchingDriveFile = folderFiles.find((driveFile) => {
      return (
        driveFile.name.trim().toLowerCase() === normalizedIncomingName &&
        (Number.parseInt(driveFile.size ?? "0", 10) || 0) === file.size
      );
    });
    const sameNameDriveFiles = folderFiles.filter(
      (driveFile) => driveFile.name.trim().toLowerCase() === normalizedIncomingName
    );

    if (matchingDriveFile?.id && !shouldOverwrite) {
      const nowIso = new Date().toISOString();
      const normalizedType =
        file.name.split(".").pop()?.trim().toLowerCase() ||
        file.type.trim().toLowerCase() ||
        "file";
      const rowToUpsert = {
        name: file.name,
        type: normalizedType,
        size: file.size,
        section: section?.trim() || null,
        course_code: normalizedCourseCode,
        subject_name: resolvedSubjectName,
        uploaded_by: uploadedBy?.trim() || existingRowToReplace?.uploaded_by || "unknown",
        uploaded_by_name:
          uploadedByName?.trim() || existingRowToReplace?.uploaded_by_name || "Unknown",
        upload_date: nowIso,
        drive_file_id: matchingDriveFile.id,
        drive_download_url: buildDriveDownloadUrl(matchingDriveFile.id),
        drive_thumbnail_url: null,
      };

      if (existingRowToReplace) {
        const { data: updated, error: updateError } = await supabase
          .from("study_files")
          .update(rowToUpsert)
          .eq("id", existingRowToReplace.id)
          .select(FILE_SELECT_COLUMNS)
          .single();

        if (updateError) {
          throw new Error(
            `Existing Drive file found, but metadata update failed: ${getErrorMessage(updateError)}`
          );
        }

        return NextResponse.json({
          file: toStudyFile(updated as StudyFileRow),
          duplicate: true,
          skipped: true,
          reusedDriveFile: true,
        });
      }

      const { data: inserted, error: insertError } = await supabase
        .from("study_files")
        .insert({
          id: `file-${crypto.randomUUID()}`,
          ...rowToUpsert,
        })
        .select(FILE_SELECT_COLUMNS)
        .single();

      if (insertError) {
        throw new Error(
          `Existing Drive file found, but metadata save failed: ${getErrorMessage(insertError)}`
        );
      }

      return NextResponse.json({
        file: toStudyFile(inserted as StudyFileRow),
        duplicate: true,
        skipped: true,
        reusedDriveFile: true,
      });
    }

    if (shouldOverwrite && matchingDriveFile?.id) {
      const previousDriveFileId = existingRowToReplace?.drive_file_id;
      const nowIso = new Date().toISOString();
      const normalizedType =
        file.name.split(".").pop()?.trim().toLowerCase() ||
        file.type.trim().toLowerCase() ||
        "file";
      const rowToUpsert = {
        name: file.name,
        type: normalizedType,
        size: file.size,
        section: section?.trim() || null,
        course_code: normalizedCourseCode,
        subject_name: resolvedSubjectName,
        uploaded_by: uploadedBy?.trim() || existingRowToReplace?.uploaded_by || "unknown",
        uploaded_by_name:
          uploadedByName?.trim() || existingRowToReplace?.uploaded_by_name || "Unknown",
        upload_date: nowIso,
        drive_file_id: matchingDriveFile.id,
        drive_download_url: buildDriveDownloadUrl(matchingDriveFile.id),
        drive_thumbnail_url: null,
      };

      if (existingRowToReplace) {
        const { data: updated, error: updateError } = await supabase
          .from("study_files")
          .update(rowToUpsert)
          .eq("id", existingRowToReplace.id)
          .select(FILE_SELECT_COLUMNS)
          .single();

        if (updateError) {
          throw new Error(
            `Retry matched an existing Drive file, but metadata update failed: ${getErrorMessage(updateError)}`
          );
        }

        if (previousDriveFileId && previousDriveFileId !== matchingDriveFile.id) {
          try {
            await deleteFileFromDrive(previousDriveFileId);
          } catch (cleanupErr) {
            console.warn(
              `[drive/upload] Failed to delete replaced Drive file ${previousDriveFileId}:`,
              cleanupErr
            );
          }
        }

        return NextResponse.json({
          file: toStudyFile(updated as StudyFileRow),
          duplicate: false,
          skipped: true,
          reusedDriveFile: true,
        });
      }

      const { data: inserted, error: insertError } = await supabase
        .from("study_files")
        .insert({
          id: `file-${crypto.randomUUID()}`,
          ...rowToUpsert,
        })
        .select(FILE_SELECT_COLUMNS)
        .single();

      if (insertError) {
        throw new Error(
          `Retry matched an existing Drive file, but metadata save failed: ${getErrorMessage(insertError)}`
        );
      }

      if (previousDriveFileId && previousDriveFileId !== matchingDriveFile.id) {
        try {
          await deleteFileFromDrive(previousDriveFileId);
        } catch (cleanupErr) {
          console.warn(
            `[drive/upload] Failed to delete replaced Drive file ${previousDriveFileId}:`,
            cleanupErr
          );
        }
      }

      return NextResponse.json({
        file: toStudyFile(inserted as StudyFileRow),
        duplicate: false,
        skipped: true,
        reusedDriveFile: true,
      });
    }

    if (shouldOverwrite && sameNameDriveFiles.length > 0) {
      for (const driveFile of sameNameDriveFiles) {
        if (driveFile.id) {
          try {
            await deleteFileFromDrive(driveFile.id);
          } catch (cleanupErr) {
            console.warn(
              `[drive/upload] Failed to delete existing Drive file ${driveFile.id} before overwrite:`,
              cleanupErr
            );
          }
        }
      }
    }

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

    let savedRow: StudyFileRow | undefined;

    if (existingRowToReplace) {
      const previousDriveFileId = existingRowToReplace.drive_file_id;
      const updatePayload = {
        name: file.name,
        type: normalizedType,
        size: file.size,
        section: section?.trim() || null,
        course_code: normalizedCourseCode,
        subject_name: resolvedSubjectName,
        uploaded_by: uploadedBy?.trim() || existingRowToReplace.uploaded_by || "unknown",
        uploaded_by_name:
          uploadedByName?.trim() || existingRowToReplace.uploaded_by_name || "Unknown",
        upload_date: nowIso,
        drive_file_id: result.fileId,
        drive_download_url: result.downloadUrl,
        drive_thumbnail_url: null,
      };

      const { data: updated, error: updateError } = await supabase
        .from("study_files")
        .update(updatePayload)
        .eq("id", existingRowToReplace.id)
        .select(FILE_SELECT_COLUMNS)
        .single();

      if (updateError) {
        try {
          await deleteFileFromDrive(result.fileId);
        } catch (rollbackErr) {
          console.error(
            "[drive/upload] Failed to rollback Drive file after DB update error:",
            rollbackErr
          );
        }
        throw new Error(
          `Upload saved to Drive but metadata update failed: ${getErrorMessage(updateError)}`
        );
      }

      savedRow = updated as StudyFileRow;

      if (previousDriveFileId && previousDriveFileId !== result.fileId) {
        try {
          await deleteFileFromDrive(previousDriveFileId);
        } catch (cleanupErr) {
          console.warn(
            `[drive/upload] Failed to delete replaced Drive file ${previousDriveFileId}:`,
            cleanupErr
          );
        }
      }
    } else {
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
