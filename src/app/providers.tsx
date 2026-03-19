"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
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
