import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { Subject } from "@/lib/types";

type RequestRow = {
  course_code: string;
  subject_name: string;
  department: string;
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
          .select("course_code,subject_name,department")
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
      if (!map.has(req.course_code)) {
        map.set(req.course_code, {
          subjectName: req.subject_name,
          department: req.department,
          fileCount: 0,
        });
      }
    }

    for (const file of (files ?? []) as FileRow[]) {
      const existing = map.get(file.course_code);
      if (existing) {
        existing.fileCount += 1;
      } else {
        map.set(file.course_code, {
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

    return NextResponse.json({ subjects });
  } catch (err: unknown) {
    console.error("[data/subjects][GET] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
