"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js");
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!rounded-xl !text-sm !font-medium !shadow-lg",
            duration: 3000,
          }}
        />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
