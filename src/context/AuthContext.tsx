"use client";
// ============================================================
// CourseDrop — Auth Context
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import { isGithubPagesRuntime } from "@/lib/runtime";

interface AuthState {
  user: User | null;
  login: (
    identifier: string,
    password: string,
    role: "admin" | "teacher"
  ) => Promise<string | null>; // returns error or null
  logout: () => Promise<string | null>; // returns error or null
  loading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  login: async () => "Not ready",
  logout: async () => "Not ready",
  loading: true,
  isInitialized: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // hydrate from server session cookie on mount only
  useEffect(() => {
    const initialize = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
          },
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = (await res.json()) as { user?: User | null };
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    void initialize();
  }, []);

  const login = async (
    identifier: string,
    password: string,
    role: "admin" | "teacher"
  ): Promise<string | null> => {
    if (role === "admin") {
      if (isGithubPagesRuntime()) {
        return "Admin login needs backend APIs and is disabled on GitHub Pages. Deploy to Vercel for full login support.";
      }

      try {
        const res = await fetch("/api/auth/admin/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        const data = (await res.json()) as { error?: string; user?: User };
        if (!res.ok) {
          return data.error ?? "Login failed";
        }

        if (!data.user) {
          return "Login failed";
        }

        setUser(data.user);
        return null;
      } catch {
        return "Network error. Try again.";
      }
    }

    if (isGithubPagesRuntime()) {
      return "Teacher/CR login needs backend APIs and is disabled on GitHub Pages. Deploy to Vercel for full login support.";
    }

    try {
      const res = await fetch("/api/auth/teacher/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = (await res.json()) as { error?: string; user?: User };
      if (!res.ok) {
        const message = data.error ?? "Login failed";
        if (message.includes("Missing Supabase configuration")) {
          return "Server is missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your hosting dashboard, then redeploy.";
        }
        return message;
      }

      if (!data.user) {
        return "Login failed";
      }

      setUser(data.user);
      return null;
    } catch {
      return "Network error. Try again.";
    }
  };

  const logout = async (): Promise<string | null> => {
    let requestError = false;

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }
    } catch {
      requestError = true;
    }

    try {
      const verifyRes = await fetch(`/api/auth/session?_ts=${Date.now()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });

      if (!verifyRes.ok) {
        setUser(null);
        return null;
      }

      const verifyData = (await verifyRes.json()) as { user?: User | null };
      if (!verifyData.user) {
        setUser(null);
        return null;
      }

      setUser(verifyData.user);
      return "Sign out failed: session cookie is still active. Please try again.";
    } catch {
      if (!requestError) {
        setUser(null);
        return null;
      }

      return "Network issue while signing out. Please check connection and retry.";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
