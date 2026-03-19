import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { CourseShareAccess } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type SharingRow = {
  course_code: string;
  teacher_ids: string[] | null;
  updated_at: string;
};

type TeacherAccountRow = {
  id: string;
  uid: string | null;
  email: string | null;
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

function parseTeacherIds(raw: string): string[] {
  return dedupe(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );
}

function buildTeacherIdentityMap(rows: TeacherAccountRow[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const row of rows) {
    const id = (row.id ?? "").trim();
    if (!id) {
      continue;
    }

    map.set(id, id);
    map.set(id.toLowerCase(), id);

    const uid = (row.uid ?? "").trim().toLowerCase();
    if (uid) {
      map.set(uid, id);
    }

    const email = (row.email ?? "").trim().toLowerCase();
    if (email) {
      map.set(email, id);
    }
  }

  return map;
}

async function getTeacherIdentityMap(): Promise<Map<string, string>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("teacher_accounts")
    .select("id,uid,email");

  if (error) {
    throw error;
  }

  return buildTeacherIdentityMap((data ?? []) as TeacherAccountRow[]);
}

function resolveTeacherIds(
  values: string[],
  identityMap: Map<string, string>,
  keepUnresolved = false
): string[] {
  const resolved: string[] = [];

  for (const value of dedupe(values.map((item) => item.trim()).filter(Boolean))) {
    const normalized = value.toLowerCase();
    const canonical = identityMap.get(value) ?? identityMap.get(normalized);
    if (canonical) {
      resolved.push(canonical);
      continue;
    }

    if (keepUnresolved) {
      resolved.push(value);
    }
  }

  return dedupe(resolved);
}

function toShare(
  row: SharingRow,
  identityMap: Map<string, string>
): CourseShareAccess {
  return {
    courseCode: (row.course_code ?? "").toUpperCase(),
    teacherIds: resolveTeacherIds(
      (row.teacher_ids ?? []).filter((id) => id && id.trim().length > 0),
      identityMap,
      true
    ),
    updatedAt: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();
    const teacherIds = parseTeacherIds(
      (req.nextUrl.searchParams.get("teacherId") ?? "").trim()
    );

    const supabase = getSupabaseAdminClient();
    const teacherIdentityMap = await getTeacherIdentityMap();

    if (courseCode) {
      const { data, error } = await supabase
        .from("course_sharing")
        .select("course_code,teacher_ids,updated_at")
        .ilike("course_code", courseCode)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return NextResponse.json(
        {
          courseCode,
          teacherIds: resolveTeacherIds(data?.teacher_ids ?? [], teacherIdentityMap, true),
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    if (teacherIds.length > 0) {
      const requestedTeacherIds = new Set(
        resolveTeacherIds(teacherIds, teacherIdentityMap, true)
      );

      const { data, error } = await supabase
        .from("course_sharing")
        .select("course_code,teacher_ids");

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as Array<{
        course_code: string;
        teacher_ids: string[] | null;
      }>;

      const courseCodes = rows
        .filter((row) => {
          const rowTeacherIds = resolveTeacherIds(
            row.teacher_ids ?? [],
            teacherIdentityMap,
            true
          );
          return rowTeacherIds.some((id) => requestedTeacherIds.has(id));
        })
        .map((row) => row.course_code);

      if (teacherIds.length === 1) {
        return NextResponse.json(
          {
            teacherId: teacherIds[0],
            courseCodes: dedupe(courseCodes.map((code) => code.toUpperCase())),
          },
          { headers: NO_STORE_HEADERS }
        );
      }

      return NextResponse.json(
        {
          teacherIds,
          courseCodes: dedupe(courseCodes.map((code) => code.toUpperCase())),
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const { data, error } = await supabase
      .from("course_sharing")
      .select("course_code,teacher_ids,updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        sharing: (data ?? []).map((row) =>
          toShare(row as SharingRow, teacherIdentityMap)
        ),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/sharing][GET] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      courseCode?: string;
      teacherIds?: string[];
    };

    const courseCode = (body.courseCode ?? "").trim().toUpperCase();
    const requestedTeacherIds = dedupe(
      (body.teacherIds ?? []).map((id) => id.trim()).filter(Boolean)
    );

    if (!courseCode) {
      return NextResponse.json(
        { error: "courseCode is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const supabase = getSupabaseAdminClient();
    const teacherIdentityMap = await getTeacherIdentityMap();

    const normalizedTeacherIds = resolveTeacherIds(
      requestedTeacherIds,
      teacherIdentityMap,
      false
    );

    const { data: ownerRows, error: ownerError } = await supabase
      .from("subject_requests")
      .select("teacher_id")
      .ilike("course_code", courseCode)
      .eq("status", "approved");

    if (ownerError) {
      throw ownerError;
    }

    const ownerTokens = (ownerRows ?? [])
      .map((row) => {
        const value = (row as { teacher_id?: unknown }).teacher_id;
        return typeof value === "string" ? value.trim() : "";
      })
      .filter(Boolean);
    const ownerTeacherIds = new Set(
      resolveTeacherIds(ownerTokens, teacherIdentityMap, true)
    );

    const teacherIds = normalizedTeacherIds.filter((id) => !ownerTeacherIds.has(id));

    if (teacherIds.length === 0) {
      const { error } = await supabase
        .from("course_sharing")
        .delete()
        .ilike("course_code", courseCode);
      if (error) {
        throw error;
      }
      return NextResponse.json(
        { courseCode, teacherIds: [] },
        { headers: NO_STORE_HEADERS }
      );
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

    return NextResponse.json(
      {
        sharing: toShare(data as SharingRow, teacherIdentityMap),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/sharing][PUT] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
