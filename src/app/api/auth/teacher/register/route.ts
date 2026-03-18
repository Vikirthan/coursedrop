import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

interface RegisterTeacherPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  department?: string;
}

function isNoRowsError(code?: string): boolean {
  return code === "PGRST116";
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
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
    const body = (await req.json()) as Partial<RegisterTeacherPayload>;

    const name = (body.name ?? "").trim();
    const username = normalizeUsername(body.username ?? "");
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const department = (body.department ?? "").trim();

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: "name, username, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-z0-9._-]{3,32}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-32 characters and contain only lowercase letters, numbers, dot, underscore, or hyphen",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: existingUsername, error: existingUsernameErr } = await supabase
      .from("teacher_accounts")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUsernameErr && !isNoRowsError(existingUsernameErr.code)) {
      throw existingUsernameErr;
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    const { data: existingEmail, error: existingEmailErr } = await supabase
      .from("teacher_accounts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmailErr && !isNoRowsError(existingEmailErr.code)) {
      throw existingEmailErr;
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    const { error: insertErr } = await supabase.from("teacher_accounts").insert({
      full_name: name,
      username,
      email,
      department: department || null,
      password_hash: passwordHash,
      approved: false,
    });

    if (insertErr) {
      if (insertErr.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Supabase table teacher_accounts is missing. Create it first in Supabase SQL editor.",
          },
          { status: 500 }
        );
      }
      throw insertErr;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Wait for admin approval before login.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[auth/teacher/register] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
