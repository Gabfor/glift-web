import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import type { ReactNode } from "react";
import ClientLayout from "@/components/ClientLayout";
import { UnlockScroll } from "@/components/UnlockScroll";
import VerifyEmailTopBar from "@/components/auth/VerifyEmailTopBar";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

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
  const cookieStore = cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (...args) => {
          void args;
          // Supabase server helpers expect these callbacks for mutating cookies
          // but we rely on Next.js middleware to handle it on the client.
        },
        remove: (...args) => {
          void args;
          // Same as above – no server-side mutations are required here.
        },
      },
    }
  );

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
