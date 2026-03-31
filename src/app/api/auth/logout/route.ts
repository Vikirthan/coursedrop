import { NextResponse } from "next/server";
import { getSessionCookieClearConfig } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieClearConfig());
  return response;
}
