import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 10;

const globalRateLimits = globalThis as typeof globalThis & {
  __coursedropAuthRateLimits?: Map<string, RateLimitState>;
};

const authRateLimits =
  globalRateLimits.__coursedropAuthRateLimits ?? new Map<string, RateLimitState>();

globalRateLimits.__coursedropAuthRateLimits = authRateLimits;

function getHeaderValue(req: NextRequest, name: string): string {
  return (req.headers.get(name) ?? "").trim();
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function isTrustedOrigin(req: NextRequest): boolean {
  const requestOrigin = normalizeOrigin(req.nextUrl.origin);
  const originHeader = getHeaderValue(req, "origin");
  if (originHeader) {
    return normalizeOrigin(originHeader) === requestOrigin;
  }

  const refererHeader = getHeaderValue(req, "referer");
  if (refererHeader) {
    try {
      return normalizeOrigin(new URL(refererHeader).origin) === requestOrigin;
    } catch {
      return false;
    }
  }

  return true;
}

export function getClientIp(req: NextRequest): string {
  const xForwardedFor = getHeaderValue(req, "x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = getHeaderValue(req, "x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = getHeaderValue(req, "cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

export function buildAuthRateLimitKey(route: string, identifier: string, req: NextRequest): string {
  return [route, getClientIp(req), identifier.trim().toLowerCase() || "unknown"].join("|");
}

export function checkAuthRateLimit(
  key: string,
  options: { windowMs?: number; maxAttempts?: number } = {}
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const current = authRateLimits.get(key);
  if (!current || current.resetAt <= now) {
    const freshState = { count: 0, resetAt: now + windowMs };
    authRateLimits.set(key, freshState);
    return { allowed: true, remaining: maxAttempts, resetAt: freshState.resetAt };
  }

  const allowed = current.count < maxAttempts;
  return {
    allowed,
    remaining: Math.max(maxAttempts - current.count, 0),
    resetAt: current.resetAt,
  };
}

export function recordAuthFailure(
  key: string,
  options: { windowMs?: number; maxAttempts?: number } = {}
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const current = authRateLimits.get(key);
  const state: RateLimitState =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

  state.count += 1;
  state.resetAt = state.resetAt > now ? state.resetAt : now + windowMs;
  authRateLimits.set(key, state);

  return {
    allowed: state.count < maxAttempts,
    remaining: Math.max(maxAttempts - state.count, 0),
    resetAt: state.resetAt,
  };
}

export function clearAuthRateLimit(key: string): void {
  authRateLimits.delete(key);
}

export function timingSafeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}