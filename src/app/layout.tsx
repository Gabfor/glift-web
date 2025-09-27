import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import type { ReactNode } from "react";
import ClientLayout from "@/components/ClientLayout";
import { UnlockScroll } from "@/components/UnlockScroll";
import VerifyEmailTopBar from "@/components/auth/VerifyEmailTopBar";

import type { Database } from "@/types/supabase";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  children: ReactNode;
}) {
  const { supabase, applyServerCookies } = await createServerSupabaseClient<Database>();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  let plan: string | null = null;

  if (user) {
    // 🔧 IMPORTANT: pas de .single()/.maybeSingle() → on fait LIMIT 1
    const { data: subRows } = await supabase
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .limit(1);

    plan = subRows?.[0]?.plan ?? null;
  }

  const isPremiumFromMetadata =
    user?.app_metadata?.plan === "premium" ||
    user?.user_metadata?.is_premium === true;
  const initialIsPremiumUser = isPremiumFromMetadata || plan === "premium";

  applyServerCookies();

  return (
    <html lang="fr">
      <head />
      <body className={quicksand.className}>
        <UnlockScroll />
        <VerifyEmailTopBar />
        {/* on ne passe pas encore `plan` si tes composants ne l’acceptent pas */}
        <ClientLayout
          initialSession={session}
          initialIsPremiumUser={initialIsPremiumUser}
        >
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
