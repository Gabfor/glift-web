import type { Metadata } from "next";
import AdminHeader from "@/components/AdminHeader";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Glift – Admin",
  description: "Interface d’administration Glift",
  manifest: "/favicons/admin/manifest.webmanifest",
  icons: {
    icon: "/favicons/admin/favicon-32x32.png",
    apple: "/favicons/admin/apple-touch-icon.png"
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={quicksand.className}>
      <AdminHeader />
      {children}
    </div>
  );
}
