"use client";

import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react"; // 👈 encore utile côté client React

import { Session } from "@supabase/supabase-js";

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [supabase] = useState(() => createClientComponentClient());

  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}
