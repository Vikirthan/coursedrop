import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

interface ForgotPasswordPayload {
  email: string;
  action: "request_otp" | "reset_password";
  otp?: string;
  newPassword?: string;
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

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isNoRowsError(code?: string): boolean {
  return code === "PGRST116";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ForgotPasswordPayload>;
    const email = (body.email ?? "").trim().toLowerCase();
    const action = body.action ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (action === "request_otp") {
      // Step 1: Generate and send OTP
      const supabase = getSupabaseAdminClient();

      const { data: teacher, error: teacherErr } = await supabase
        .from("teacher_accounts")
        .select("id, full_name")
        .eq("email", email)
        .maybeSingle();

      if (teacherErr && !isNoRowsError(teacherErr.code)) {
        throw teacherErr;
      }

      if (!teacher) {
        // For security, don't reveal if email exists
        return NextResponse.json(
          { success: true, message: "If an account with this email exists, an OTP will be sent" },
          { status: 200 }
        );
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in password_reset_otp table (create if doesn't exist)
      const { error: otpErr } = await supabase
        .from("password_reset_otps")
        .upsert(
          {
            email,
            otp,
            expires_at: otpExpiry.toISOString(),
          },
          { onConflict: "email" }
        );

      if (otpErr) {
        console.error("OTP storage error:", otpErr);
        // Continue anyway - in production, you'd handle this better
      }

      // TODO: Send email with OTP using a service like SendGrid, AWS SES, etc.
      // For now, log the OTP (INSECURE - for testing only)
      console.log(`[PASSWORD_RESET] OTP for ${email}: ${otp}`);

      return NextResponse.json(
        { success: true, message: "OTP sent to your email" },
        { status: 200 }
      );
    }

    if (action === "reset_password") {
      // Step 2: Verify OTP and reset password
      const otp = (body.otp ?? "").trim();
      const newPassword = body.newPassword ?? "";

      if (!otp) {
        return NextResponse.json({ error: "OTP is required" }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdminClient();

      // Verify OTP
      const { data: otpRecord, error: otpErr } = await supabase
        .from("password_reset_otps")
        .select("otp, expires_at")
        .eq("email", email)
        .maybeSingle();

      if (otpErr && !isNoRowsError(otpErr.code)) {
        throw otpErr;
      }

      if (!otpRecord) {
        return NextResponse.json(
          { error: "No OTP request found. Please request a new OTP" },
          { status: 404 }
        );
      }

      if (otpRecord.otp !== otp) {
        return NextResponse.json(
          { error: "Invalid OTP" },
          { status: 401 }
        );
      }

      const expiresAt = new Date(otpRecord.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "OTP has expired. Please request a new one" },
          { status: 401 }
        );
      }

      // Hash new password
      const passwordHash = await hash(newPassword, 10);

      // Update password in database
      const { error: updateErr } = await supabase
        .from("teacher_accounts")
        .update({ password_hash: passwordHash })
        .eq("email", email);

      if (updateErr) {
        throw updateErr;
      }

      // Delete the used OTP
      await supabase
        .from("password_reset_otps")
        .delete()
        .eq("email", email);

      return NextResponse.json(
        { success: true, message: "Password reset successfully" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("[auth/teacher/forgot-password] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
