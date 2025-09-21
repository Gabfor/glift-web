"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Maybe<T> = T | null | undefined;

export function useEmailVerification() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const signedIn = Boolean(user);
    setIsSignedIn(signedIn);

    // Si pas connecté → on masque la bannière
    if (!signedIn) {
      setIsVerified(true); // “considéré vérifié” pour ne pas afficher
      setLoading(false);
      return;
    }

    // Source de vérité: Auth
    const confirmedFromAuth =
      Boolean((user as Maybe<any>)?.email_confirmed_at) ||
      Boolean((user as Maybe<any>)?.confirmed_at);

    // Secours: profiles.email_verified (si synchronisé côté serveur)
    let confirmedFromProfile = false;
    if (!confirmedFromAuth) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("id", user!.id)
        .maybeSingle();
      confirmedFromProfile = prof?.email_verified === true;
    }

    setIsVerified(confirmedFromAuth || confirmedFromProfile);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
    const { data } = supabase.auth.onAuthStateChange(() => refresh());
    return () => {
      data.subscription.unsubscribe();
    };
  }, [refresh, supabase]);

  const resend = useCallback(async () => {
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email to resend verification");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (error) throw error;

      setResentAt(Date.now());
    } finally {
      setResending(false);
    }
  }, [supabase]);

  return { loading, isSignedIn, isVerified, resend, resending, resentAt };
}
