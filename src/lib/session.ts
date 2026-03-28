import { createHmac, timingSafeEqual } from "crypto";
import { User } from "@/lib/types";

const SESSION_COOKIE_NAME = "coursedrop_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

type SessionPayload = {
  user: User;
  exp: number;
};

function getSessionSecret(): string {
  const explicit = (process.env.APP_SESSION_SECRET ?? "").trim();
  if (explicit) {
    return explicit;
  }

  const fallback = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (fallback) {
    return fallback;
  }

  throw new Error(
    "Missing session secret. Set APP_SESSION_SECRET (recommended) or SUPABASE_SERVICE_ROLE_KEY."
  );
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function createSessionToken(user: User): string {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): User | null {
  const [encodedPayload, incomingSignature] = token.split(".");
  if (!encodedPayload || !incomingSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const incomingBuffer = Buffer.from(incomingSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (incomingBuffer.length !== expectedBuffer.length) {
    return null;
  }

  const isValid = timingSafeEqual(incomingBuffer, expectedBuffer);
  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload?.user || typeof payload.exp !== "number") {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }

    return payload.user;
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_TTL_SECONDS;
}
