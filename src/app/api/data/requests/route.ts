import { NextRequest, NextResponse } from "next/server";
import { forbiddenJson, getSessionUserFromRequest, unauthorizedJson } from "@/lib/apiAuth";
import { sendSubjectRequestStatusEmail } from "@/lib/email";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { RequestStatus, SubjectRequest } from "@/lib/types";
import {
  formatTeacherDisplayName,
  inferDesignationFromDepartment,
  normalizeDesignation,
} from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

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

type RequestStatusNotificationRow = {
  id: string;
  status: RequestStatus;
  teacher_email: string;
  teacher_name: string;
  subject_name: string;
  course_code: string;
};

type TeacherAccountLookupRow = {
  id: string;
  uid: string;
  email: string;
  department: string | null;
  designation?: string | null;
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

function isMissingColumnError(code?: string): boolean {
  return code === "42703";
}

async function resolveTeacherDisplayName(params: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  teacherId: string;
  teacherEmail: string;
  fallbackName: string;
}): Promise<string> {
  const { supabase, teacherId, teacherEmail, fallbackName } = params;

  const lookupWithDesignation = await supabase
    .from("teacher_accounts")
    .select("id,uid,email,department,designation")
    .or(`id.eq.${teacherId},uid.eq.${teacherId},email.eq.${teacherEmail}`)
    .maybeSingle<TeacherAccountLookupRow>();

  let data = lookupWithDesignation.data;
  let error = lookupWithDesignation.error;

  if (error && isMissingColumnError(error.code)) {
    const fallbackLookup = await supabase
      .from("teacher_accounts")
      .select("id,uid,email,department")
      .or(`id.eq.${teacherId},uid.eq.${teacherId},email.eq.${teacherEmail}`)
      .maybeSingle<TeacherAccountLookupRow>();

    data = fallbackLookup.data;
    error = fallbackLookup.error;
  }

  if (error || !data) {
    return fallbackName;
  }

  const designation =
    normalizeDesignation(data.designation) ||
    inferDesignationFromDepartment(data.department);

  return formatTeacherDisplayName(fallbackName, designation);
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

function parseCsvValues(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );
}

export async function GET(req: NextRequest) {
  try {
    const teacherIdRaw = (req.nextUrl.searchParams.get("teacherId") ?? "").trim();
    const teacherIds = parseCsvValues(teacherIdRaw);
    const teacherEmails = parseCsvValues(
      (req.nextUrl.searchParams.get("teacherEmail") ?? "").trim().toLowerCase()
    );
    const courseCode = (req.nextUrl.searchParams.get("courseCode") ?? "").trim().toUpperCase();
    const statusRaw = (req.nextUrl.searchParams.get("status") ?? "").trim().toLowerCase();

    if (statusRaw && !isValidStatus(statusRaw)) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("subject_requests")
      .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id")
      .order("created_at", { ascending: false });

    if (courseCode) {
      query = query.ilike("course_code", courseCode);
    }
    if (statusRaw) {
      query = query.eq("status", statusRaw);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const rows = (data ?? []) as RequestRow[];
    const teacherIdSet = new Set(teacherIds);
    const teacherEmailSet = new Set(teacherEmails);

    const filteredRows = rows.filter((row) => {
      if (teacherIdSet.size === 0 && teacherEmailSet.size === 0) {
        return true;
      }

      const matchesTeacherId = teacherIdSet.has(row.teacher_id);
      const matchesTeacherEmail = teacherEmailSet.has(
        (row.teacher_email ?? "").toLowerCase()
      );

      return matchesTeacherId || matchesTeacherEmail;
    });

    return NextResponse.json(
      { requests: filteredRows.map(toSubjectRequest) },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/requests][GET] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
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
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const supabase = getSupabaseAdminClient();
    const teacherDisplayName = await resolveTeacherDisplayName({
      supabase,
      teacherId,
      teacherEmail,
      fallbackName: teacherName,
    });

    const now = new Date().toISOString();
    const row: RequestRow = {
      id: body.id?.trim() || `req-${crypto.randomUUID()}`,
      teacher_id: teacherId,
      teacher_name: teacherDisplayName,
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

    const { data, error } = await supabase
      .from("subject_requests")
      .insert(row)
      .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { request: toSubjectRequest(data as RequestRow) },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/requests][POST] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = getSessionUserFromRequest(req);
    if (!sessionUser) {
      return unauthorizedJson("Please sign in");
    }

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
    const wantsStatusUpdate = typeof body.status === "string";

    if (typeof body.status === "string") {
      if (!isValidStatus(body.status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      updateData.status = body.status;
    }

    if (wantsStatusUpdate && sessionUser.role !== "admin") {
      return forbiddenJson("Only admin can update request status");
    }

    if (Object.prototype.hasOwnProperty.call(body, "driveFolderId")) {
      const val = typeof body.driveFolderId === "string" ? body.driveFolderId.trim() : "";
      updateData.drive_folder_id = val || null;
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: "Nothing to update. Provide status and/or driveFolderId." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const supabase = getSupabaseAdminClient();

    if (id) {
      let previousRow: RequestStatusNotificationRow | null = null;
      if (wantsStatusUpdate) {
        const previous = await supabase
          .from("subject_requests")
          .select("id,status,teacher_email,teacher_name,subject_name,course_code")
          .eq("id", id)
          .single();

        if (previous.error) {
          throw previous.error;
        }

        previousRow = previous.data as RequestStatusNotificationRow;
      }

      const { data, error } = await supabase
        .from("subject_requests")
        .update(updateData)
        .eq("id", id)
        .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id")
        .single();

      if (error) {
        throw error;
      }

      if (
        wantsStatusUpdate &&
        previousRow &&
        previousRow.status !== data.status &&
        (data.status === "approved" || data.status === "rejected")
      ) {
        void sendSubjectRequestStatusEmail({
          toEmail: data.teacher_email,
          recipientName: data.teacher_name,
          subjectName: data.subject_name,
          courseCode: data.course_code,
          approved: data.status === "approved",
        }).catch((mailErr) => {
          console.error("[data/requests][PATCH] Failed to send status email:", mailErr);
        });
      }

      return NextResponse.json(
        { request: toSubjectRequest(data as RequestRow) },
        { headers: NO_STORE_HEADERS }
      );
    }

    if (!courseCode) {
      return NextResponse.json(
        { error: "id or courseCode is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { data: approvedCandidates, error: approvedError } = await supabase
      .from("subject_requests")
      .select("id,course_code")
      .eq("status", "approved");

    if (approvedError) {
      throw approvedError;
    }

    const requestIds = (approvedCandidates ?? [])
      .filter((row) => {
        const normalized = String((row as { course_code?: unknown }).course_code ?? "")
          .trim()
          .toUpperCase();
        return normalized === courseCode;
      })
      .map((row) => String((row as { id?: unknown }).id ?? "").trim())
      .filter((value) => value.length > 0);

    let data: RequestRow[] = [];
    let previousRowsById = new Map<string, RequestStatusNotificationRow>();

    if (wantsStatusUpdate && requestIds.length > 0) {
      const previousRowsResult = await supabase
        .from("subject_requests")
        .select("id,status,teacher_email,teacher_name,subject_name,course_code")
        .in("id", requestIds);

      if (previousRowsResult.error) {
        throw previousRowsResult.error;
      }

      previousRowsById = new Map(
        ((previousRowsResult.data ?? []) as RequestStatusNotificationRow[]).map((row) => [
          row.id,
          row,
        ])
      );
    }

    if (requestIds.length > 0) {
      const result = await supabase
        .from("subject_requests")
        .update(updateData)
        .in("id", requestIds)
        .select("id,teacher_id,teacher_name,teacher_email,department,subject_name,course_code,message,status,created_at,updated_at,drive_folder_id");

      if (result.error) {
        throw result.error;
      }

      data = (result.data ?? []) as RequestRow[];

      if (wantsStatusUpdate) {
        for (const row of data) {
          const previous = previousRowsById.get(row.id);
          if (!previous || previous.status === row.status) {
            continue;
          }

          if (row.status !== "approved" && row.status !== "rejected") {
            continue;
          }

          void sendSubjectRequestStatusEmail({
            toEmail: row.teacher_email,
            recipientName: row.teacher_name,
            subjectName: row.subject_name,
            courseCode: row.course_code,
            approved: row.status === "approved",
          }).catch((mailErr) => {
            console.error("[data/requests][PATCH] Failed to send status email:", mailErr);
          });
        }
      }
    }

    return NextResponse.json(
      { requests: data.map((row) => toSubjectRequest(row)) },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("[data/requests][PATCH] Error:", err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
