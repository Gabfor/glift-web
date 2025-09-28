import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import { UnlockScroll } from "@/components/UnlockScroll";
import VerifyEmailTopBar from "@/components/auth/VerifyEmailTopBar";

import { headers } from "next/headers";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Glift",
  description: "Plateforme Glift",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicons/front/favicon-32x32.png",
    apple: "/favicons/front/apple-touch-icon.png",
  },
};

async function fetchUserContext() {
  const requestHeaders = headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  const baseUrl = host ? `${protocol}://${host}` : "";

  try {
    const response = await fetch(`${baseUrl}/api/auth/user`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NEXT_PUBLIC_DEBUG === "1") {
        console.warn("[RootLayout] unable to load user context", response.status);
      }
      return { user: null, plan: null };
    }

    return response.json();
  } catch (error) {
    if (process.env.NEXT_PUBLIC_DEBUG === "1") {
      console.warn("[RootLayout] error loading user context", error);
    }
    return { user: null, plan: null };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_DEBUG === "1") {
    console.log("[RootLayout] render");
  }

  await fetchUserContext();

  return (
    <html lang="fr">
      <head />
      <body className={quicksand.className}>
        <UnlockScroll />
        <VerifyEmailTopBar />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
