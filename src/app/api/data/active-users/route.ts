import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

type ActiveUserMap = Map<string, number>;

declare global {
  // eslint-disable-next-line no-var
  var __coursedropActiveUsers: ActiveUserMap | undefined;
}

function getStore(): ActiveUserMap {
  if (!globalThis.__coursedropActiveUsers) {
    globalThis.__coursedropActiveUsers = new Map<string, number>();
  }
  return globalThis.__coursedropActiveUsers;
}

function cleanup(store: ActiveUserMap, now: number): void {
  for (const [sessionId, ts] of store.entries()) {
    if (now - ts > ACTIVE_WINDOW_MS) {
      store.delete(sessionId);
    }
  }
}

export async function GET() {
  const now = Date.now();
  const store = getStore();
  cleanup(store, now);

  return NextResponse.json(
    { activeUsers: store.size },
    { headers: NO_STORE_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId?: string };
    const sessionId = (body.sessionId ?? "").trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const now = Date.now();
    const store = getStore();

    store.set(sessionId, now);
    cleanup(store, now);

    return NextResponse.json(
      { activeUsers: store.size },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
