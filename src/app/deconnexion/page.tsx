"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { endLogoutBarrier } from "@/lib/supabaseClient";

export default function DeconnexionPage() {
  const supabase = useSupabase();
  const [message, setMessage] = useState("Déconnexion en cours...");

  useEffect(() => {
    let active = true;

    async function performLogout() {
      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch (_error) {
        if (active) {
          setMessage("Une erreur est survenue, redirection...");
        }
      } finally {
        endLogoutBarrier();
      }
    }

    performLogout();

    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-center text-base text-neutral-700">{message}</p>
    </div>
  );
}
