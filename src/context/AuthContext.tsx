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
  logout: () => void;
  loading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  login: async () => "Not ready",
  logout: () => {},
  loading: true,
  isInitialized: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // hydrate from localStorage on mount only
  useEffect(() => {
    try {
      const stored = localStorage.getItem("coursedrop_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsInitialized(true);
    setLoading(false);
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
        localStorage.setItem("coursedrop_user", JSON.stringify(data.user));
        return null;
      } catch {
        return "Network error. Try again.";
      }
    }

    if (isGithubPagesRuntime()) {
      return "Teacher login needs backend APIs and is disabled on GitHub Pages. Deploy to Vercel for full login support.";
    }

    try {
      const res = await fetch("/api/auth/teacher/login", {
        method: "POST",
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
      localStorage.setItem("coursedrop_user", JSON.stringify(data.user));
      return null;
    } catch {
      return "Network error. Try again.";
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("coursedrop_user");
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
