import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "./providers";

export const metadata: Metadata = {
  title: "CourseDrop — Study Material Portal",
  description:
    "A modern platform for teachers to share and students to access subject-wise study materials.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark:bg-slate-950">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
