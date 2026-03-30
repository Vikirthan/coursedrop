import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/session";
import { User, UserRole } from "@/lib/types";

type AuthResult =
  | { user: User; response?: never }
  | { user?: never; response: NextResponse };

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUserFromCookies(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export function getSessionUserFromRequest(req: NextRequest): User | null {
  const token = req.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export function unauthorizedJson(message = "Unauthorized"): NextResponse {
  const response = NextResponse.json({ error: message }, { status: 401 });
  clearSessionCookie(response);
  return response;
}

export function forbiddenJson(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function requireRoleFromRequest(req: NextRequest, role: UserRole): AuthResult {
  const user = getSessionUserFromRequest(req);
  if (!user) {
    return { response: unauthorizedJson("Please sign in") };
  }

  if (user.role !== role) {
    return { response: forbiddenJson("Insufficient permissions") };
  }

  return { user };
}

export function requireAdminRequest(req: NextRequest): AuthResult {
  return requireRoleFromRequest(req, "admin");
}
