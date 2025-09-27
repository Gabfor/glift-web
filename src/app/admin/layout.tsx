import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import { Quicksand } from "next/font/google";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    applyServerCookies();
    redirect("/connexion");
  }

  const isAdmin = (user.user_metadata as any)?.is_admin === true;
  if (!isAdmin) {
    applyServerCookies();
    redirect("/compte");
  }

  applyServerCookies();
  return (
    <div className={quicksand.className}>
      <AdminHeader />
      {children}
    </div>
  );
}
