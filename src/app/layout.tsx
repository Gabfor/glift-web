import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import { Quicksand } from "next/font/google";
import Footer from "@/components/Footer";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Glift",
  description: "Plateforme Glift",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={quicksand.className}>
          <Header />
          {children}
          <Footer />
      </body>
    </html>
  );
}
