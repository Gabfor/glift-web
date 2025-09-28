import "./globals.css";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import { UnlockScroll } from "@/components/UnlockScroll";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head />
      <body className={quicksand.className}>
        <UnlockScroll />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
