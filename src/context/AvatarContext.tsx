"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

type AvatarContextType = {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
};

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Ici tu peux utiliser supabase pour fetch ton avatar si besoin
  useMemo(() => {
    if (!supabase) return;
    // TODO: charger avatar si logique existante
  }, [supabase]);

  return (
    <AvatarContext.Provider value={{ avatarUrl, setAvatarUrl }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar must be used within AvatarProvider");
  return ctx;
}
