import type { Metadata } from "next";
import AdminHeader from "@/components/AdminHeader";
import { Quicksand } from "next/font/google";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";

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
    apple: "/favicons/admin/apple-touch-icon.png",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerClient({ scope: "admin" });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  if (!user.user_metadata?.is_admin) {
    redirect("/");
  }

  return (
    <div className={quicksand.className}>
      <AdminHeader />
      {children}
    </div>
  );
}
