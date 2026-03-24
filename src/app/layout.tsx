import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProviders from "./providers";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://coursedrop.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "CourseDrop — Study Material Portal",
    template: "%s | CourseDrop",
  },
  description:
    "A modern platform for teachers to share and students to access subject-wise study materials.",
  applicationName: "CourseDrop",
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "CourseDrop",
    title: "CourseDrop — Study Material Portal",
    description:
      "A modern platform for teachers to share and students to access subject-wise study materials.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CourseDrop sharing preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CourseDrop — Study Material Portal",
    description:
      "A modern platform for teachers to share and students to access subject-wise study materials.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
