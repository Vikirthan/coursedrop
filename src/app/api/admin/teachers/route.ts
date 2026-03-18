import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

interface ApprovePayload {
  id: string;
  teacher_id?: string;
  approved: boolean;
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

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("teacher_accounts")
      .select("id,full_name,username,email,department,approved,created_at,approved_at")
      .order("created_at", { ascending: false });

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
    const body = (await req.json()) as Partial<ApprovePayload>;
    const id = body.id ?? body.teacher_id ?? "";
    const approved = Boolean(body.approved);

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("teacher_accounts")
      .update({
        approved,
        approved_at: approved ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id,full_name,username,email,department,approved,created_at,approved_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ teacher: data });
  } catch (err: unknown) {
    console.error("[admin/teachers][PATCH] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
