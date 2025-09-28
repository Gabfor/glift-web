"use client";

import { useUser } from "@/context/UserContext";

export function useSessionAwareClient() {
  const context = useUser();
  return {
    supabase: context.supabase,
    status: context.status,
    sessionVersion: context.sessionVersion,
    user: context.user,
    session: context.session,
    refreshSession: context.refreshSession,
    isAuthResolved: context.isAuthResolved,
  };
}
