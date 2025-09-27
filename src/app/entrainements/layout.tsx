import { redirect } from "next/navigation";
import { createSSRClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  return <>{children}</>;
}
