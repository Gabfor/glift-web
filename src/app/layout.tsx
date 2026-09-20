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
import { headers } from "next/headers";

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

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isAdminSubdomain = host.startsWith("admin.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://glift.io";

  const rootSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Glift",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "@id": `${siteUrl}/#logo`,
          "url": `${siteUrl}/logo-glift.svg`,
          "caption": "Glift"
        },
        "founder": {
          "@type": "Person",
          "name": "Gabriel Fort",
          "url": `${siteUrl}/blog/auteurs/gabriel-fort`
        }
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        "name": "Glift",
        "url": siteUrl,
        "applicationCategory": "HealthAndFitnessApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "description": "Plateforme et application web de musculation : conception de programmes d'entraînement sur mesure, suivi de séances en salle, notation de ressenti et analyse de progression.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR",
          "category": "Free"
        },
        "publisher": {
          "@id": `${siteUrl}/#organization`
        }
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "Glift",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "inLanguage": "fr-FR"
      }
    ]
  };

  // On passe initialSession={null} pour éviter le warning serveur de Supabase (getSession).
  // Le client gérera sa propre session via SupabaseProvider et getUser().
  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootSchema) }}
        />
      </head>
      <body className={quicksand.className}>
        <UnlockScroll />
        <ClientLayoutWrapper initialSession={null} isAdminSubdomain={isAdminSubdomain}>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
