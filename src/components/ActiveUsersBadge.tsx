"use client";

import { useEffect, useRef, useState } from "react";
import { FiUsers } from "react-icons/fi";

const SESSION_KEY = "coursedrop_session_id";
const HEARTBEAT_MS = 30_000;

function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = localStorage.getItem(SESSION_KEY);
  if (existing && existing.trim()) {
    return existing;
  }

  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(SESSION_KEY, nextId);
  return nextId;
}

export default function ActiveUsersBadge() {
  const [count, setCount] = useState<number | null>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    sessionIdRef.current = getSessionId();

    const sendHeartbeat = async () => {
      if (!sessionIdRef.current) {
        return;
      }

      try {
        const res = await fetch(`/api/data/active-users?_ts=${Date.now()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          cache: "no-store",
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        });

        const data = (await res.json().catch(() => ({}))) as { activeUsers?: number };
        if (res.ok && typeof data.activeUsers === "number") {
          setCount(data.activeUsers);
        }
      } catch {
        // Keep previous value on transient network errors.
      }
    };

    void sendHeartbeat();
    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    };

    window.addEventListener("focus", sendHeartbeat);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sendHeartbeat);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:text-sm">
      <FiUsers size={14} />
      <span>Active Users: {count ?? "--"}</span>
    </div>
  );
}
