"use client";

import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react"; // 👈 encore utile côté client React

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createClientComponentClient()
  );

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
