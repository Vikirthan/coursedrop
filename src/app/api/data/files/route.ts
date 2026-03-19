import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { StudyFile } from "@/lib/types";

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

export async function GET(req: NextRequest) {
  try {
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("study_files")
      .select("id,name,type,size,section,course_code,subject_name,uploaded_by,uploaded_by_name,upload_date,drive_file_id,drive_download_url,drive_thumbnail_url")
      .order("upload_date", { ascending: false });

    if (courseCode) {
      query = query.eq("course_code", courseCode);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({ files: (data ?? []).map((row) => toStudyFile(row as FileRow)) });
  } catch (err: unknown) {
    console.error("[data/files][GET] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
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
        { status: 400 }
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

    return NextResponse.json({ file: toStudyFile(data as FileRow) }, { status: 201 });
  } catch (err: unknown) {
    console.error("[data/files][POST] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const fileId = (req.nextUrl.searchParams.get("fileId") ?? "").trim();
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();

    if (!fileId && !courseCode) {
      return NextResponse.json(
        { error: "fileId or courseCode is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase.from("study_files").delete();

    if (fileId) {
      query = query.eq("id", fileId);
    } else {
      query = query.eq("course_code", courseCode);
    }

    const { data, error } = await query.select("id");
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, deleted: data?.length ?? 0 });
  } catch (err: unknown) {
    console.error("[data/files][DELETE] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
