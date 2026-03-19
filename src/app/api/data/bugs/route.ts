import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { BugReport, BugReportStatus } from "@/lib/types";

type BugRow = {
  id: string;
  reporter_name: string;
  reporter_email: string;
  reporter_role: string;
  page_path: string | null;
  message: string;
  status: BugReportStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const VALID_STATUSES: BugReportStatus[] = ["open", "triaged", "resolved"];

function isValidStatus(value: string): value is BugReportStatus {
  return VALID_STATUSES.includes(value as BugReportStatus);
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

function toBugReport(row: BugRow): BugReport {
  return {
    id: row.id,
    reporterName: row.reporter_name,
    reporterEmail: row.reporter_email,
    reporterRole: row.reporter_role as BugReport["reporterRole"],
    pagePath: row.page_path ?? undefined,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const statusRaw = (req.nextUrl.searchParams.get("status") ?? "").trim().toLowerCase();

    if (statusRaw && !isValidStatus(statusRaw)) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("bug_reports")
      .select("id,reporter_name,reporter_email,reporter_role,page_path,message,status,admin_note,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (statusRaw) {
      query = query.eq("status", statusRaw);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({ reports: (data ?? []).map((row) => toBugReport(row as BugRow)) });
  } catch (err: unknown) {
    console.error("[data/bugs][GET] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BugReport>;

    const message = (body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const reporterRoleRaw = (body.reporterRole ?? "guest").toString();
    const reporterRole =
      reporterRoleRaw === "admin" || reporterRoleRaw === "teacher" || reporterRoleRaw === "student"
        ? reporterRoleRaw
        : "guest";

    const row: BugRow = {
      id: body.id?.trim() || `bug-${crypto.randomUUID()}`,
      reporter_name: (body.reporterName ?? "Anonymous").trim() || "Anonymous",
      reporter_email: (body.reporterEmail ?? "").trim(),
      reporter_role: reporterRole,
      page_path: (body.pagePath ?? "").trim() || null,
      message,
      status: "open",
      admin_note: null,
      created_at: now,
      updated_at: now,
    };

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bug_reports")
      .insert(row)
      .select("id,reporter_name,reporter_email,reporter_role,page_path,message,status,admin_note,created_at,updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ report: toBugReport(data as BugRow) }, { status: 201 });
  } catch (err: unknown) {
    console.error("[data/bugs][POST] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: string;
      status?: BugReportStatus;
      adminNote?: string;
    };

    const id = (body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.status === "string") {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (typeof body.adminNote === "string") {
      updateData.admin_note = body.adminNote.trim();
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bug_reports")
      .update(updateData)
      .eq("id", id)
      .select("id,reporter_name,reporter_email,reporter_role,page_path,message,status,admin_note,created_at,updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ report: toBugReport(data as BugRow) });
  } catch (err: unknown) {
    console.error("[data/bugs][PATCH] Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
