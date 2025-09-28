import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import ClientLayout from "@/components/ClientLayout";
import SupabaseProvider from "@/components/SupabaseProvider";
import { UnlockScroll } from "@/components/UnlockScroll";
import VerifyEmailTopBar from "@/components/auth/VerifyEmailTopBar";

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

type RootLayoutProps = {
  children: React.ReactNode;
};

async function loadServerSession() {
  const cookieStore = await Promise.resolve(cookies());

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let subscriptionPlan: string | null = null;

  if (user) {
    const { data: rows } = await supabase
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .limit(1);

    subscriptionPlan = rows?.[0]?.plan ?? null;
  }

  return { subscriptionPlan };
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { subscriptionPlan } = await loadServerSession();

  return (
    <html lang="fr">
      <head />
      <body
        className={quicksand.className}
        data-subscription-plan={subscriptionPlan ?? "none"}
      >
        <UnlockScroll />
        <VerifyEmailTopBar />
        <SupabaseProvider>
          <ClientLayout>{children}</ClientLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
