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
  metadataBase: new URL("https://glift.io"),
  title: {
    default: "Glift - Musculation & Fitness",
    template: "%s | Glift",
  },
  description: "Digitalisez vos programmes de musculation, suivez vos performances et progressez efficacement avec Glift.",
  manifest: "/manifest.webmanifest",
  authors: [{ name: "Glift" }],
  publisher: "Glift",
  creator: "Glift",
  icons: {
    icon: "/favicons/front/favicon-32x32.png",
    apple: "/favicons/front/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://glift.io",
    siteName: "Glift",
    title: "Glift - Musculation & Fitness",
    description: "Digitalisez vos programmes de musculation, suivez vos performances et progressez efficacement.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Glift - Votre plateforme de musculation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glift - Musculation & Fitness",
    description: "Digitalisez vos programmes de musculation et suivez vos performances.",
  },
};

import { createClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: Promise<{ lang?: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.lang || "fr";
  const supabase = await createClient();

  // On passe initialSession={null} pour éviter le warning serveur de Supabase (getSession).
  // Le client gérera sa propre session via SupabaseProvider et getUser().
  return (
    <html lang={locale}>
      <body className={quicksand.className}>
        <UnlockScroll />
        <ClientLayoutWrapper initialSession={null}>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
