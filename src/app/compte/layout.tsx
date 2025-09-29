import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";

export default async function CompteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  return children;
}
