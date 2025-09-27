import { redirect } from "next/navigation";
import HeroConcept from "@/components/HeroConcept";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { supabase, applyServerCookies } = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    applyServerCookies();
    redirect("/entrainements");
  }

  applyServerCookies();
  return <HeroConcept />;
}
