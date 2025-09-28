"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { SessionContextProvider } from "@supabase/auth-helpers-react"; // 👈 encore utile côté client React

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(supabaseUrl, supabaseAnonKey)
  );

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
