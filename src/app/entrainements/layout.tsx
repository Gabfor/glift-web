// src/app/compte/layout.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    applyServerCookies();
    redirect("/connexion");
  }

  applyServerCookies();
  return <>{children}</>;
}
