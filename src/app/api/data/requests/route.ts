import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { RequestStatus, SubjectRequest } from "@/lib/types";

type RequestRow = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  department: string;
  subject_name: string;
  course_code: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  drive_folder_id: string | null;
};

const VALID_STATUSES: RequestStatus[] = ["pending", "approved", "rejected"];

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

function toSubjectRequest(row: RequestRow): SubjectRequest {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    teacherEmail: row.teacher_email,
    department: row.department,
    subjectName: row.subject_name,
    courseCode: row.course_code,
    message: row.message ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    driveFolderId: row.drive_folder_id ?? undefined,
  };
}

function isValidStatus(value: string): value is RequestStatus {
  return VALID_STATUSES.includes(value as RequestStatus);
}

export async function GET(req: NextRequest) {
  try {
    const teacherId = (req.nextUrl.searchParams.get("teacherId") ?? "").trim();
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();
    const statusRaw = (req.nextUrl.searchParams.get("status") ?? "").trim().toLowerCase();

    if (statusRaw && !isValidStatus(statusRaw)) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("subject_requests")
      .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id")
      .order("created_at", { ascending: false });

    if (teacherId) {
      query = query.eq("teacher_id", teacherId);
    }
    if (courseCode) {
      query = query.eq("course_code", courseCode);
    }
    if (statusRaw) {
      query = query.eq("status", statusRaw);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({ requests: (data ?? []).map(toSubjectRequest) });
  } catch (err: unknown) {
    console.error("[data/requests][GET] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SubjectRequest>;

    const teacherId = (body.teacherId ?? "").trim();
    const teacherName = (body.teacherName ?? "").trim();
    const teacherEmail = (body.teacherEmail ?? "").trim().toLowerCase();
    const department = (body.department ?? "").trim();
    const subjectName = (body.subjectName ?? "").trim();
    const courseCode = (body.courseCode ?? "").trim().toUpperCase();
    const message = (body.message ?? "").trim();

    if (!teacherId || !teacherName || !teacherEmail || !department || !subjectName || !courseCode) {
      return NextResponse.json(
        { error: "teacherId, teacherName, teacherEmail, department, subjectName, and courseCode are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const row: RequestRow = {
      id: body.id?.trim() || `req-${crypto.randomUUID()}`,
      teacher_id: teacherId,
      teacher_name: teacherName,
      teacher_email: teacherEmail,
      department,
      subject_name: subjectName,
      course_code: courseCode,
      message: message || null,
      status: "pending",
      created_at: now,
      updated_at: now,
      drive_folder_id: null,
    };

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("subject_requests")
      .insert(row)
      .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ request: toSubjectRequest(data as RequestRow) }, { status: 201 });
  } catch (err: unknown) {
    console.error("[data/requests][POST] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: string;
      courseCode?: string;
      status?: RequestStatus;
      driveFolderId?: string | null;
    };

    const id = (body.id ?? "").trim();
    const courseCode = (body.courseCode ?? "").trim().toUpperCase();

    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.status === "string") {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (Object.prototype.hasOwnProperty.call(body, "driveFolderId")) {
      const val = typeof body.driveFolderId === "string" ? body.driveFolderId.trim() : "";
      updateData.drive_folder_id = val || null;
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: "Nothing to update. Provide status and/or driveFolderId." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    if (id) {
      const { data, error } = await supabase
        .from("subject_requests")
        .update(updateData)
        .eq("id", id)
        .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id")
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ request: toSubjectRequest(data as RequestRow) });
    }

    if (!courseCode) {
      return NextResponse.json(
        { error: "id or courseCode is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("subject_requests")
      .update(updateData)
      .eq("course_code", courseCode)
      .eq("status", "approved");

    const { data, error } = await query
      .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id");

    if (error) {
      throw error;
    }

    return NextResponse.json({ requests: (data ?? []).map((row) => toSubjectRequest(row as RequestRow)) });
  } catch (err: unknown) {
    console.error("[data/requests][PATCH] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
