import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;

  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = verifySessionToken(sessionToken);
  if (!user) {
    const response = NextResponse.json({ user: null }, { status: 401 });
    response.cookies.set({
      name: getSessionCookieName(),
      value: "",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.json({ user }, { status: 200 });
}
