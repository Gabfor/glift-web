"use client";

import { createClientComponentClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const logout = async () => {
      document.cookie = "glift-remember=; Path=/; Max-Age=0; SameSite=Lax";
      await supabase.auth.signOut();
      router.push("/");
    };
    logout();
  }, [supabase, router]);

  return null;
}
