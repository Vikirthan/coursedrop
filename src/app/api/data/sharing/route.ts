import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { CourseShareAccess } from "@/lib/types";

type SharingRow = {
  course_code: string;
  teacher_ids: string[] | null;
  updated_at: string;
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

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function toShare(row: SharingRow): CourseShareAccess {
  return {
    courseCode: row.course_code,
    teacherIds: dedupe((row.teacher_ids ?? []).filter((id) => id && id.trim().length > 0)),
    updatedAt: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();
    const teacherId = (req.nextUrl.searchParams.get("teacherId") ?? "").trim();

    const supabase = getSupabaseAdminClient();

    if (courseCode) {
      const { data, error } = await supabase
        .from("course_sharing")
        .select("course_code,teacher_ids,updated_at")
        .eq("course_code", courseCode)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        courseCode,
        teacherIds: data?.teacher_ids ?? [],
      });
    }

    if (teacherId) {
      const { data, error } = await supabase
        .from("course_sharing")
        .select("course_code")
        .contains("teacher_ids", [teacherId]);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        teacherId,
        courseCodes: (data ?? []).map((row) => row.course_code),
      });
    }

    const { data, error } = await supabase
      .from("course_sharing")
      .select("course_code,teacher_ids,updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      sharing: (data ?? []).map((row) => toShare(row as SharingRow)),
    });
  } catch (err: unknown) {
    console.error("[data/sharing][GET] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      courseCode?: string;
      teacherIds?: string[];
    };

    const courseCode = (body.courseCode ?? "").trim().toUpperCase();
    const teacherIds = dedupe((body.teacherIds ?? []).map((id) => id.trim()).filter(Boolean));

    if (!courseCode) {
      return NextResponse.json({ error: "courseCode is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    if (teacherIds.length === 0) {
      const { error } = await supabase.from("course_sharing").delete().eq("course_code", courseCode);
      if (error) {
        throw error;
      }
      return NextResponse.json({ courseCode, teacherIds: [] });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("course_sharing")
      .upsert(
        {
          course_code: courseCode,
          teacher_ids: teacherIds,
          updated_at: now,
        },
        { onConflict: "course_code" }
      )
      .select("course_code,teacher_ids,updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ sharing: toShare(data as SharingRow) });
  } catch (err: unknown) {
    console.error("[data/sharing][PUT] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
