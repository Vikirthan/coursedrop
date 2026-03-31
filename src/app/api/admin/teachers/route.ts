import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/apiAuth";
import { sendTeacherApprovalStatusEmail } from "@/lib/email";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

interface ApprovePayload {
  id: string;
  teacher_id?: string;
  approved: boolean;
}

type TeacherAccountResponseRow = {
  id: string;
  full_name: string;
  uid: string;
  contact: string;
  email: string;
  department: string | null;
  designation?: string | null;
  approved: boolean;
  created_at: string;
  approved_at: string | null;
};

function isMissingColumnError(code?: string): boolean {
  return code === "42703";
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

export async function GET(req: NextRequest) {
  try {
    const auth = requireAdminRequest(req);
    if ("response" in auth) {
      return auth.response;
    }

    const supabase = getSupabaseAdminClient();
    const primary = await supabase
      .from("teacher_accounts")
      .select("id,full_name,uid,contact,email,department,designation,approved,created_at,approved_at")
      .order("created_at", { ascending: false });

    let data = (primary.data ?? null) as TeacherAccountResponseRow[] | null;
    let error = primary.error;

    if (error && isMissingColumnError(error.code)) {
      const fallback = await supabase
        .from("teacher_accounts")
        .select("id,full_name,uid,contact,email,department,approved,created_at,approved_at")
        .order("created_at", { ascending: false });
      data = (fallback.data ?? null) as TeacherAccountResponseRow[] | null;
      error = fallback.error;
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ teachers: data ?? [] });
  } catch (err: unknown) {
    console.error("[admin/teachers][GET] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAdminRequest(req);
    if ("response" in auth) {
      return auth.response;
    }

    const body = (await req.json()) as Partial<ApprovePayload>;
    const id = body.id ?? body.teacher_id ?? "";
    const approved = Boolean(body.approved);

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: existingTeacher, error: existingTeacherError } = await supabase
      .from("teacher_accounts")
      .select("id,full_name,email,approved,approved_at")
      .eq("id", id)
      .single();

    if (existingTeacherError) {
      throw existingTeacherError;
    }

    const primaryUpdate = await supabase
      .from("teacher_accounts")
      .update({
        approved,
        approved_at: approved
          ? new Date().toISOString()
          : existingTeacher?.approved_at ?? null,
      })
      .eq("id", id)
      .select("id,full_name,uid,contact,email,department,designation,approved,created_at,approved_at")
      .single();

    let data = (primaryUpdate.data ?? null) as TeacherAccountResponseRow | null;
    let error = primaryUpdate.error;

    if (error && isMissingColumnError(error.code)) {
      const fallbackUpdate = await supabase
        .from("teacher_accounts")
        .update({
          approved,
          approved_at: approved
            ? new Date().toISOString()
            : existingTeacher?.approved_at ?? null,
        })
        .eq("id", id)
        .select("id,full_name,uid,contact,email,department,approved,created_at,approved_at")
        .single();

      data = (fallbackUpdate.data ?? null) as TeacherAccountResponseRow | null;
      error = fallbackUpdate.error;
    }

    if (error) {
      throw error;
    }

    if (
      existingTeacher &&
      typeof existingTeacher.email === "string" &&
      existingTeacher.email.trim() &&
      existingTeacher.approved !== approved
    ) {
      void sendTeacherApprovalStatusEmail({
        toEmail: existingTeacher.email,
        recipientName:
          typeof existingTeacher.full_name === "string"
            ? existingTeacher.full_name
            : null,
        approved,
      }).catch((mailErr) => {
        console.error("[admin/teachers][PATCH] Email send failed:", mailErr);
      });
    }

    return NextResponse.json({ teacher: data });
  } catch (err: unknown) {
    console.error("[admin/teachers][PATCH] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
