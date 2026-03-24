import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { Subject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type RequestRow = {
  course_code: string;
  subject_name: string;
  department: string;
  drive_folder_id: string | null;
};

type FileRow = {
  course_code: string;
  subject_name: string;
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

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const [{ data: approvedRequests, error: reqError }, { data: files, error: fileError }] =
      await Promise.all([
        supabase
          .from("subject_requests")
          .select("course_code,subject_name,department,drive_folder_id")
          .eq("status", "approved"),
        supabase.from("study_files").select("course_code,subject_name"),
      ]);

    if (reqError) {
      throw reqError;
    }
    if (fileError) {
      throw fileError;
    }

    const map = new Map<string, { subjectName: string; department: string; fileCount: number }>();

    for (const req of (approvedRequests ?? []) as RequestRow[]) {
      const courseCode = (req.course_code ?? "").trim().toUpperCase();
      const driveFolderId = (req.drive_folder_id ?? "").trim();
      if (!courseCode) {
        continue;
      }

      // Hide courses that no longer have an active Drive folder.
      if (!driveFolderId) {
        continue;
      }

      if (!map.has(courseCode)) {
        map.set(courseCode, {
          subjectName: req.subject_name,
          department: req.department,
          fileCount: 0,
        });
      }
    }

    for (const file of (files ?? []) as FileRow[]) {
      const courseCode = (file.course_code ?? "").trim().toUpperCase();
      if (!courseCode) {
        continue;
      }

      const existing = map.get(courseCode);
      if (existing) {
        existing.fileCount += 1;
        if (!existing.subjectName && file.subject_name) {
          existing.subjectName = file.subject_name;
        }
      } else {
        map.set(courseCode, {
          subjectName: file.subject_name,
          department: "",
          fileCount: 1,
        });
      }
    }

    const subjects: Subject[] = Array.from(map.entries())
      .map(([courseCode, value]) => ({
        courseCode,
        subjectName: value.subjectName,
        department: value.department,
        fileCount: value.fileCount,
      }))
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    return NextResponse.json({ subjects }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    console.error("[data/subjects][GET] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
