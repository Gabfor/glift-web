import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { UnlockScroll } from "@/components/UnlockScroll";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

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

import { createClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // On passe initialSession={null} pour éviter le warning serveur de Supabase (getSession).
  // Le client gérera sa propre session via SupabaseProvider et getUser().
  return (
    <html lang="fr">
      <body className={quicksand.className}>
        <UnlockScroll />
        <ClientLayoutWrapper initialSession={null}>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
