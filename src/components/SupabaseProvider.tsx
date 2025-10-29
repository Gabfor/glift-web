"use client";

import { useMemo, useRef } from "react";
import { createClientComponentClient } from "@/lib/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react"; // 👈 encore utile côté client React
import type { SupabaseSessionScope } from "@/lib/supabase/sessionScope";

type SupabaseProviderProps = {
  children: React.ReactNode;
  scope: SupabaseSessionScope;
};

export default function SupabaseProvider({
  children,
  scope,
}: SupabaseProviderProps) {
  const clientsRef = useRef<
    Partial<Record<SupabaseSessionScope, ReturnType<typeof createClientComponentClient>>>
  >({});

  const supabase = useMemo(() => {
    if (!clientsRef.current[scope]) {
      clientsRef.current[scope] = createClientComponentClient({ scope });
    }

    return clientsRef.current[scope]!;
  }, [scope]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
