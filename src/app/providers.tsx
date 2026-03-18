"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
