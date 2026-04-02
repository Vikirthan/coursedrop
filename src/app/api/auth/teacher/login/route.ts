import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  createSessionToken,
  getSessionCookieConfig,
} from "@/lib/session";
import { User } from "@/lib/types";
import { inferDesignationFromDepartment, normalizeDesignation } from "@/lib/utils";
import {
  buildAuthRateLimitKey,
  checkAuthRateLimit,
  clearAuthRateLimit,
  isTrustedOrigin,
  recordAuthFailure,
} from "@/lib/authSecurity";

type TeacherAccountRow = {
  id: string;
  full_name: string;
  uid: string;
  contact: string;
  email: string;
  department: string | null;
  designation?: string | null;
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

export async function POST(req: NextRequest) {
  try {
    if (!isTrustedOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as Partial<TeacherLoginPayload>;
    const identifier = (body.identifier ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const rateLimitKey = buildAuthRateLimitKey("teacher-login", identifier, req);
    const rateLimit = checkAuthRateLimit(rateLimitKey, {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 10,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 }
      );
    }

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "UID and password are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const primary = await supabase
      .from("teacher_accounts")
      .select("id,full_name,uid,contact,email,department,designation,password_hash,approved")
      .eq("uid", identifier)
      .maybeSingle<TeacherAccountRow>();

    let data = primary.data;
    let error = primary.error;

    if (error && isMissingColumnError(error.code)) {
      const fallback = await supabase
        .from("teacher_accounts")
        .select("id,full_name,uid,contact,email,department,password_hash,approved")
        .eq("uid", identifier)
        .maybeSingle<TeacherAccountRow>();

      data = fallback.data;
      error = fallback.error;
    }

    if (error && !isNoRowsError(error.code)) {
      throw error;
    }

    if (!data) {
      recordAuthFailure(rateLimitKey, { windowMs: 15 * 60 * 1000, maxAttempts: 10 });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordOk = await compare(password, data.password_hash);
    if (!passwordOk) {
      recordAuthFailure(rateLimitKey, { windowMs: 15 * 60 * 1000, maxAttempts: 10 });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!data.approved) {
      clearAuthRateLimit(rateLimitKey);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user: User = {
      id: data.id,
      username: data.uid,
      name: data.full_name,
      role: "teacher",
      email: data.email,
      department: data.department ?? undefined,
      designation:
        normalizeDesignation(data.designation) ||
        inferDesignationFromDepartment(data.department) ||
        undefined,
    };

    const response = NextResponse.json({ user });
    response.cookies.set(getSessionCookieConfig(createSessionToken(user)));
    clearAuthRateLimit(rateLimitKey);

    return response;
  } catch (err: unknown) {
    console.error("[auth/teacher/login] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
