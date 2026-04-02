import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import {
  createSessionToken,
  getSessionCookieConfig,
} from "@/lib/session";
import { User } from "@/lib/types";
import {
  buildAuthRateLimitKey,
  checkAuthRateLimit,
  clearAuthRateLimit,
  isTrustedOrigin,
  timingSafeStringEqual,
  recordAuthFailure,
} from "@/lib/authSecurity";

interface AdminLoginPayload {
  identifier: string;
  password: string;
}

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

function getAdminPasswordConfig(): {
  passwordHash: string | null;
  passwordPlain: string | null;
} {
  const passwordHash = readEnv("ADMIN_LOGIN_PASSWORD_HASH");
  const passwordPlain = readEnv("ADMIN_LOGIN_PASSWORD");

  if (passwordHash) {
    return { passwordHash, passwordPlain: null };
  }

  return {
    passwordHash: null,
    passwordPlain: passwordPlain || null,
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!isTrustedOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as Partial<AdminLoginPayload>;
    const identifier = (body.identifier ?? "").trim();
    const password = body.password ?? "";
    const rateLimitKey = buildAuthRateLimitKey("admin-login", identifier, req);
    const rateLimit = checkAuthRateLimit(rateLimitKey, {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 }
      );
    }

    if (!identifier || !password) {
      return NextResponse.json({ error: "Admin ID and password are required" }, { status: 400 });
    }

    const adminId = readEnv("ADMIN_LOGIN_ID");
    const { passwordHash, passwordPlain } = getAdminPasswordConfig();

    if (!adminId || (!passwordHash && !passwordPlain)) {
      return NextResponse.json(
        {
          error:
            "Admin login is not configured. Set ADMIN_LOGIN_ID and ADMIN_LOGIN_PASSWORD_HASH (preferred) or ADMIN_LOGIN_PASSWORD in environment variables.",
        },
        { status: 500 }
      );
    }

    const identifierOk = timingSafeStringEqual(identifier, adminId);
    let passwordOk = false;

    if (passwordHash) {
      passwordOk = await compare(password, passwordHash);
    } else if (passwordPlain) {
      passwordOk = timingSafeStringEqual(password, passwordPlain);
    }

    if (!identifierOk || !passwordOk) {
      recordAuthFailure(rateLimitKey, { windowMs: 15 * 60 * 1000, maxAttempts: 5 });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user: User = {
      id: "admin",
      username: adminId,
      name: "Admin",
      role: "admin",
      email: "admin@coursedrop.local",
    };

    const response = NextResponse.json({ user });
    response.cookies.set(getSessionCookieConfig(createSessionToken(user)));
    clearAuthRateLimit(rateLimitKey);

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
