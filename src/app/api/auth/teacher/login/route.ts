import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type TeacherAccountRow = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  department: string | null;
  password_hash: string;
  approved: boolean;
};

interface TeacherLoginPayload {
  identifier: string;
  password: string;
}

function isNoRowsError(code?: string): boolean {
  return code === "PGRST116";
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TeacherLoginPayload>;
    const identifier = (body.identifier ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "identifier and password are required" },
        { status: 400 }
      );
    }

    const field = identifier.includes("@") ? "email" : "username";
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("teacher_accounts")
      .select("id,full_name,username,email,department,password_hash,approved")
      .eq(field, identifier)
      .maybeSingle<TeacherAccountRow>();

    if (error && !isNoRowsError(error.code)) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordOk = await compare(password, data.password_hash);
    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!data.approved) {
      return NextResponse.json(
        { error: "Your account is pending admin approval" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: data.id,
        username: data.username,
        name: data.full_name,
        role: "teacher",
        email: data.email,
        department: data.department ?? undefined,
      },
    });
  } catch (err: unknown) {
    console.error("[auth/teacher/login] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
