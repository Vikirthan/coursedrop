"use client";
// ============================================================
// CourseDrop — Auth Context (dummy auth with localStorage)
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import { CREDENTIALS, DUMMY_USERS } from "@/lib/mockData";
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
}

const AuthContext = createContext<AuthState>({
  user: null,
  login: async () => "Not ready",
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("coursedrop_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = async (
    identifier: string,
    password: string,
    role: "admin" | "teacher"
  ): Promise<string | null> => {
    if (role === "admin") {
      const cred = CREDENTIALS[identifier];
      if (!cred || cred.password !== password) return "Invalid credentials";
      const u = DUMMY_USERS.find((u) => u.id === cred.userId && u.role === "admin");
      if (!u) return "User not found";
      setUser(u);
      localStorage.setItem("coursedrop_user", JSON.stringify(u));
      return null;
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
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
