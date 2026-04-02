import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieClearConfig } from "@/lib/session";
import { isTrustedOrigin } from "@/lib/authSecurity";

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieClearConfig());
  return response;
}
