import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieConfig,
} from "@/lib/session";
import { User } from "@/lib/types";

interface AdminLoginPayload {
  identifier: string;
  password: string;
}

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AdminLoginPayload>;
    const identifier = (body.identifier ?? "").trim();
    const password = body.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Admin ID and password are required" }, { status: 400 });
    }

    const adminId = readEnv("ADMIN_LOGIN_ID");
    const adminPassword = readEnv("ADMIN_LOGIN_PASSWORD");

    if (!adminId || !adminPassword) {
      return NextResponse.json(
        {
          error:
            "Admin login is not configured. Set ADMIN_LOGIN_ID and ADMIN_LOGIN_PASSWORD in environment variables.",
        },
        { status: 500 }
      );
    }

    if (identifier !== adminId || password !== adminPassword) {
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

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
