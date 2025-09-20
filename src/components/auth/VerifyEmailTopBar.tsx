"use client";

import Spinner from "@/components/ui/Spinner";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase/client";

const COOLDOWN_MS = 30_000; // 30s anti-spam

export default function VerifyEmailTopBar() {
  const supabase = createClientComponentClient();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileVerified, setProfileVerified] = useState<boolean>(true); // éviter flash
  const [resending, setResending] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const check = async () => {
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user ?? null;

    if (!user) {
      setHasSession(false);
      setUserId(null);
      setProfileVerified(true);
      setLoading(false);
      return;
    }

    setHasSession(true);
    setUserId(user.id);

    const { data: row, error } = await supabase
      .from("profiles")
      .select("email_verified")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setProfileVerified(true);
    } else {
      setProfileVerified(Boolean(row?.email_verified));
    }
    setLoading(false);
  };

  // 1) Au montage + onAuthStateChange
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      await check();
      const sub = supabase.auth.onAuthStateChange(() => check());
      unsub = () => sub.data.subscription.unsubscribe();
    })();
    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Re-check sur navigation interne
  useEffect(() => {
    if (!loading) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 3) Re-check quand l’onglet reprend le focus / redevient visible
  useEffect(() => {
    const onFocus = () => check();
    const onVis = () => {
      if (!document.hidden) check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) 🔔 Realtime Supabase : cache la bannière dès que profiles.email_verified passe à TRUE
  useEffect(() => {
    if (!userId || profileVerified) return;
    const channel = supabase
      .channel(`profiles-verify-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          const v = (payload.new as any)?.email_verified;
          if (v) setProfileVerified(true);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, profileVerified]);

  // 5) 🔔 Cross-tab : réagit à la page de confirmation (localStorage + BroadcastChannel)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "glift:email_verified") check();
    };
    window.addEventListener("storage", onStorage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("glift");
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "email_verified") check();
      };
    } catch {}

    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        bc?.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Décale le layout si la barre est visible
  useEffect(() => {
    const root = document.documentElement; // <html>
    const visible = !loading && hasSession && !profileVerified;
    if (visible) root.setAttribute("data-emailbar-visible", "true");
    else root.removeAttribute("data-emailbar-visible");
    return () => root.removeAttribute("data-emailbar-visible");
  }, [loading, hasSession, profileVerified]);

  // Cooldown
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!resentAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [resentAt]);

  const remainingMs = useMemo(() => {
    if (!resentAt) return 0;
    return Math.max(0, COOLDOWN_MS - (now - resentAt));
  }, [resentAt, now]);

  const remainingSec = Math.ceil(remainingMs / 1000);
  const resendDisabled = resending || remainingMs > 0;

  if (loading || !hasSession || profileVerified) return null;

  const resend = async () => {
    if (resendDisabled) return;
    setResending(true);
    setErrorMsg("");
    setPreviewUrl("");

    try {
      const res = await fetch("/api/email/resend", { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setErrorMsg(json?.error || "Échec de l’envoi. Réessaie dans quelques instants.");
        return;
      }

      if (json.sent) {
        setResentAt(Date.now());
        return;
      }

      if (json.previewUrl) {
        try {
          window.open(json.previewUrl as string, "_blank", "noopener,noreferrer");
        } catch {}
        setPreviewUrl(json.previewUrl as string);
        setResentAt(Date.now());
        return;
      }

      setErrorMsg("Demande acceptée, mais aucun email n’a été envoyé.");
    } catch {
      setErrorMsg("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div id="verify-email-topbar" className="w-full sticky top-0 z-[40] bg-[#7069FA] text-white h-9">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="h-9 flex items-center justify-center gap-1 text-[13px] font-semibold text-white">
          <span className="flex items-center leading-none">
            ⚠️ Pour finaliser votre inscription, validez votre email en cliquant sur le lien reçu.
          </span>

          <button
            type="button"
            onClick={resend}
            disabled={resendDisabled}
            className={`
              no-bg-disabled
              h-9 flex items-center leading-none
              bg-transparent appearance-none border-0 shadow-none
              text-white disabled:opacity-100
              hover:bg-transparent active:bg-transparent
              focus:outline-none
              ${resendDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {resending ? (
              <span className="inline-flex items-center gap-1 leading-none">
                <span className="relative top-[1px]">
                  <Spinner size="sm" ariaLabel="Renvoi en cours" />
                </span>
                Envoi…
              </span>
            ) : remainingMs > 0 ? (
              `Renvoyer (${remainingSec}s)`
            ) : (
              "Cliquer ici pour renvoyer l’email."
            )}
          </button>

          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center leading-none underline underline-offset-2 decoration-white hover:decoration-white"
            >
              Ouvrir le lien de confirmation
            </a>
          )}

          {errorMsg && <span className="flex items-center leading-none">— {errorMsg}</span>}
        </div>
      </div>
    </div>
  );
}