import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import AdminHeader from "@/components/AdminHeader";
import { Quicksand } from "next/font/google";

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
  const jar = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => jar.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const isAdmin = (user.user_metadata as any)?.is_admin === true;
  if (!isAdmin) {
    redirect("/compte");
  }

  return (
    <div className={quicksand.className}>
      <AdminHeader />
      {children}
    </div>
  );
}
