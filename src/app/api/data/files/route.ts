import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { listFilesInFolder } from "@/lib/drive";
import { StudyFile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type FileRow = {
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

type RequestRow = {
  course_code: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  drive_folder_id: string | null;
};

const FILE_SELECT_COLUMNS =
  "id,name,type,size,section,course_code,subject_name,uploaded_by,uploaded_by_name,upload_date,drive_file_id,drive_download_url,drive_thumbnail_url";

const DRIVE_SYNC_MIN_INTERVAL_MS = 60_000;
const lastDriveSyncMsByCourse = new Map<string, number>();

function shouldSyncFromQuery(raw: string): boolean {
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function deriveFileType(name: string, mimeType: string): string {
  const dot = name.lastIndexOf(".");
  if (dot >= 0 && dot < name.length - 1) {
    return name.slice(dot + 1).toLowerCase();
  }

  const fromMime = mimeType.split("/").pop()?.trim().toLowerCase();
  return fromMime || "file";
}

async function syncCourseFromDrive(courseCode: string): Promise<{ inserted: number; warnings: string[] }> {
  const warnings: string[] = [];
  const supabase = getSupabaseAdminClient();

  const { data: requestRows, error: requestError } = await supabase
    .from("subject_requests")
    .select("course_code,subject_name,teacher_id,teacher_name,drive_folder_id")
    .ilike("course_code", courseCode)
    .eq("status", "approved");

  if (requestError) {
    throw requestError;
  }

  const approvedRows = (requestRows ?? []) as RequestRow[];
  const rowByFolder = new Map<string, RequestRow>();
  for (const row of approvedRows) {
    const folderId = (row.drive_folder_id ?? "").trim();
    if (!folderId || rowByFolder.has(folderId)) {
      continue;
    }
    rowByFolder.set(folderId, row);
  }

  if (rowByFolder.size === 0) {
    return { inserted: 0, warnings };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("study_files")
    .select("drive_file_id")
    .ilike("course_code", courseCode);

  if (existingError) {
    throw existingError;
  }

  const existingDriveIds = new Set(
    (existingRows ?? [])
      .map((row) => {
        const value = (row as { drive_file_id?: unknown }).drive_file_id;
        return typeof value === "string" ? value.trim() : "";
      })
      .filter((value) => value.length > 0)
  );

  const rowsToInsert: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    section: null;
    course_code: string;
    subject_name: string;
    uploaded_by: string;
    uploaded_by_name: string;
    upload_date: string;
    drive_file_id: string;
    drive_download_url: string;
    drive_thumbnail_url: null;
  }> = [];

  for (const [folderId, ownerRow] of rowByFolder.entries()) {
    try {
      const driveFiles = await listFilesInFolder(folderId);

      for (const driveFile of driveFiles) {
        const driveId = (driveFile.id ?? "").trim();
        if (!driveId || existingDriveIds.has(driveId)) {
          continue;
        }

        existingDriveIds.add(driveId);
        rowsToInsert.push({
          id: `file-${crypto.randomUUID()}`,
          name: (driveFile.name ?? "").trim() || `drive-file-${driveId}`,
          type: deriveFileType(driveFile.name ?? "", driveFile.mimeType ?? ""),
          size: Number.parseInt(driveFile.size ?? "0", 10) || 0,
          section: null,
          course_code: courseCode,
          subject_name: (ownerRow.subject_name ?? "").trim() || courseCode,
          uploaded_by: (ownerRow.teacher_id ?? "").trim() || "unknown",
          uploaded_by_name: (ownerRow.teacher_name ?? "").trim() || "Recovered",
          upload_date: new Date().toISOString(),
          drive_file_id: driveId,
          drive_download_url: `https://drive.google.com/uc?export=download&id=${driveId}`,
          drive_thumbnail_url: null,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown drive sync error";
      warnings.push(`Folder ${folderId}: ${message}`);
    }
  }

  if (rowsToInsert.length === 0) {
    return { inserted: 0, warnings };
  }

  const { error: insertError } = await supabase
    .from("study_files")
    .insert(rowsToInsert)
    .select("id");

  if (insertError) {
    throw insertError;
  }

  return { inserted: rowsToInsert.length, warnings };
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

function toStudyFile(row: FileRow): StudyFile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size,
    section: row.section ?? undefined,
    courseCode: (row.course_code ?? "").toUpperCase(),
    subjectName: row.subject_name,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name,
    uploadDate: row.upload_date,
    driveFileId: row.drive_file_id,
    driveDownloadUrl: row.drive_download_url,
    driveThumbnailUrl: row.drive_thumbnail_url ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();
    const sync = shouldSyncFromQuery(req.nextUrl.searchParams.get("sync") ?? "");
    let syncResult: { inserted: number; warnings: string[] } | null = null;

    if (courseCode && sync) {
      const nowMs = Date.now();
      const lastSyncMs = lastDriveSyncMsByCourse.get(courseCode) ?? 0;

      if (nowMs - lastSyncMs >= DRIVE_SYNC_MIN_INTERVAL_MS) {
        try {
          syncResult = await syncCourseFromDrive(courseCode);
          lastDriveSyncMsByCourse.set(courseCode, nowMs);
        } catch (syncErr: unknown) {
          const msg = getErrorMessage(syncErr);
          console.warn(`[data/files][GET] Drive sync warning for ${courseCode}:`, msg);
          syncResult = { inserted: 0, warnings: [msg] };
        }
      }
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("study_files")
      .select(FILE_SELECT_COLUMNS)
      .order("upload_date", { ascending: false });

    if (courseCode) {
      query = query.ilike("course_code", courseCode);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        files: (data ?? []).map((row) => toStudyFile(row as FileRow)),
        sync: syncResult
          ? {
              inserted: syncResult.inserted,
              warnings: syncResult.warnings,
            }
          : undefined,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/files][GET] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<StudyFile>;

    const id = (body.id ?? "").trim() || `file-${crypto.randomUUID()}`;
    const name = (body.name ?? "").trim();
    const type = (body.type ?? "").trim();
    const size = Number(body.size ?? 0);
    const section = (body.section ?? "").trim();
    const courseCode = (body.courseCode ?? "").trim().toUpperCase();
    const subjectName = (body.subjectName ?? "").trim();
    const uploadedBy = (body.uploadedBy ?? "").trim();
    const uploadedByName = (body.uploadedByName ?? "").trim();
    const uploadDate = (body.uploadDate ?? "").trim() || new Date().toISOString();
    const driveFileId = (body.driveFileId ?? "").trim();
    const driveDownloadUrl = (body.driveDownloadUrl ?? "").trim();
    const driveThumbnailUrl = (body.driveThumbnailUrl ?? "").trim();

    if (!name || !type || !courseCode || !subjectName || !uploadedBy || !uploadedByName || !driveFileId || !driveDownloadUrl) {
      return NextResponse.json(
        { error: "Missing required file metadata fields" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const row = {
      id,
      name,
      type,
      size,
      section: section || null,
      course_code: courseCode,
      subject_name: subjectName,
      uploaded_by: uploadedBy,
      uploaded_by_name: uploadedByName,
      upload_date: uploadDate,
      drive_file_id: driveFileId,
      drive_download_url: driveDownloadUrl,
      drive_thumbnail_url: driveThumbnailUrl || null,
    };

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("study_files")
      .insert(row)
      .select("id,name,type,size,section,course_code,subject_name,uploaded_by,uploaded_by_name,upload_date,drive_file_id,drive_download_url,drive_thumbnail_url")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { file: toStudyFile(data as FileRow) },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/files][POST] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const fileId = (req.nextUrl.searchParams.get("fileId") ?? "").trim();
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();

    if (!fileId && !courseCode) {
      return NextResponse.json(
        { error: "fileId or courseCode is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase.from("study_files").delete();

    if (fileId) {
      query = query.eq("id", fileId);
    } else {
      query = query.ilike("course_code", courseCode);
    }

    const { data, error } = await query.select("id");
    if (error) {
      throw error;
    }

    return NextResponse.json(
      { success: true, deleted: data?.length ?? 0 },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/files][DELETE] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
