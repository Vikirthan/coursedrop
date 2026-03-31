import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSessionCookieClearConfig,
  getSessionCookieName,
  verifySessionToken,
} from "@/lib/session";

function noStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;

  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 401, headers: noStoreHeaders() });
  }

  const user = verifySessionToken(sessionToken);
  if (!user) {
    const response = NextResponse.json({ user: null }, { status: 401, headers: noStoreHeaders() });
    response.cookies.set(getSessionCookieClearConfig());
    return response;
  }

  return NextResponse.json({ user }, { status: 200, headers: noStoreHeaders() });
}
