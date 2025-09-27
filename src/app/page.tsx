import { redirect } from "next/navigation";
import HeroConcept from "@/components/HeroConcept";
import { createSSRClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/entrainements");
  }

  return <HeroConcept />;
}
