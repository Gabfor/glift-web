import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import { UnlockScroll } from "@/components/UnlockScroll";
import VerifyEmailTopBar from "@/components/auth/VerifyEmailTopBar";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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
if (process.env.NEXT_PUBLIC_DEBUG === '1') {
  console.log('[RootLayout] render');
}

  // Supabase SSR
  const cookieStoreMaybe: any = (cookies as any)();
  const cookieStore =
    typeof cookieStoreMaybe?.then === "function" ? await cookieStoreMaybe : cookieStoreMaybe;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <html lang="fr">
      <head />
      <body className={quicksand.className}>
        <UnlockScroll />
        <VerifyEmailTopBar />
        {/* on ne passe pas encore `plan` si tes composants ne l’acceptent pas */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
