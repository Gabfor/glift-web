"use client";

import { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createClient } from "@/lib/supabaseClient";

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  const client = useMemo(() => createClient(), []);

  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseClient<Database> {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return client;
}
