import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import { UnlockScroll } from "@/components/UnlockScroll";
import VerifyEmailTopBar from "@/components/auth/VerifyEmailTopBar";
import { createSSRClient } from "@/lib/supabase/server";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_DEBUG === "1") {
    console.log("[RootLayout] render");
  }

  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let plan: string | null = null;

  if (user) {
    const { data: subRows } = await supabase
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .limit(1);

    plan = subRows?.[0]?.plan ?? null;
  }

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
