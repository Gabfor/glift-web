"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

import { useUser } from "@/context/UserContext";
import { createClientComponentClient } from "@/lib/supabase/client";
import { isAuthSessionMissingError } from "@supabase/auth-js";
import type { PostgrestError } from "@supabase/supabase-js";

interface ProfileRow {
  email_verified: boolean | null;
  email_verification_deadline?: string | null;
}

const parseISODate = (value: unknown): Date | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function VerifyEmailBanner() {
  const { user } = useUser();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const userId = user?.id ?? null;

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const deletionAttemptRef = useRef(false);

  const enforceDeletion = useCallback(
    async (currentDeadline: Date | null) => {
      if (!currentDeadline || currentDeadline.getTime() > Date.now()) {
        return;
      }

      if (deletionAttemptRef.current) {
        return;
      }

      deletionAttemptRef.current = true;

      try {
        const response = await fetch("/api/auth/email-verification", {
          method: "DELETE",
        });

        if (response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { deleted?: boolean }
            | null;

          if (payload?.deleted) {
            await supabase.auth.signOut();
            router.replace("/connexion?verification=expiree=1");
            router.refresh();
            return;
          }
        }
      } catch (error) {
        console.error("Suppression du compte non vérifié impossible", error);
      } finally {
        deletionAttemptRef.current = false;
      }
    },
    [router, supabase],
  );

  useEffect(() => {
    let cancelled = false;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    if (!userId) {
      setShow(false);
      setDeadline(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const computeDeadline = (profile: ProfileRow | null): Date | null => {
      const metadataDeadline = parseISODate(
        (user?.user_metadata as Record<string, unknown> | undefined)?.
          email_verification_deadline,
      );
      const profileDeadline = parseISODate(profile?.email_verification_deadline);
      const createdAt = user?.created_at ? new Date(user.created_at) : null;
      const fallbackDeadline = createdAt ? addDays(createdAt, 7) : null;

      return metadataDeadline ?? profileDeadline ?? fallbackDeadline;
    };

    const handleProfileLoadError = (error: unknown) => {
      if (isAuthSessionMissingError(error)) {
        setShow(false);
        setDeadline(null);
        return;
      }

      const isPostgrestError = (value: unknown): value is PostgrestError => {
        return Boolean(value && typeof value === "object" && "code" in value);
      };

      if (isPostgrestError(error)) {
        const silentCodes = new Set(["PGRST116", "PGRST301", "42501"]);

        if (silentCodes.has(error.code)) {
          setShow(false);
          setDeadline(null);
          return;
        }

        if (typeof error.message === "string") {
          console.error("Lecture du profil impossible", error.message, error);
          setShow(false);
          setDeadline(null);
          return;
        }
      }

      console.error("Lecture du profil impossible", error);
      setShow(false);
      setDeadline(null);
    };

    const load = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("email_verified, email_verification_deadline")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (error) {
          handleProfileLoadError(error);
          return;
        }

        const profile = data as ProfileRow | null;
        const isVerified =
          Boolean(profile?.email_verified) || Boolean(user?.email_confirmed_at);

        setShow(!isVerified);

        const computedDeadline = computeDeadline(profile);
        setDeadline(computedDeadline);

        if (!isVerified) {
          void enforceDeletion(computedDeadline);
        }

        activeChannel = supabase
          .channel(`profiles-email-verified-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${userId}`,
            },
            (payload) => {
              const next = (payload.new as ProfileRow | null)?.email_verified;
              if (typeof next === "boolean") {
                setShow(!next);
                if (next) {
                  setDeadline(null);
                }
              }
            },
          )
          .subscribe();
      } catch (error) {
        if (cancelled) {
          return;
        }

        handleProfileLoadError(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [enforceDeletion, supabase, user, userId]);

  const formattedDeadline = useMemo(() => {
    if (!deadline) {
      return null;
    }

    try {
      return format(deadline, "d MMMM yyyy", { locale: fr });
    } catch (error) {
      console.error("Formatage de la date de vérification impossible", error);
      return null;
    }
  }, [deadline]);

  if (!userId || loading || !show) {
    return null;
  }

  const handleResend = async () => {
    try {
      setResending(true);
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Renvoi de l'email de vérification impossible");
      }
    } catch (error) {
      console.error("Renvoi de l'email de vérification impossible", error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-transparent flex justify-center px-4 pt-2">
      <div className="w-[1152px] max-w-full">
        <div
          className="relative rounded-[8px] px-5 py-4 bg-[#E3F9E5]"
          role="status"
          aria-live="polite"
        >
          <span className="absolute left-0 top-0 h-full w-[6px] bg-[#57AE5B] rounded-l-[8px]" />
          <p className="text-[#245B2C] text-[15px] font-bold mb-1">
            Merci pour votre inscription&nbsp;!
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[#245B2C] text-[14px] font-semibold leading-relaxed">
              Pour finaliser votre inscription, confirmez votre email en cliquant sur le lien reçu.
              {formattedDeadline
                ? ` Vous avez jusqu'au ${formattedDeadline} pour valider votre adresse.`
                : ""}
              {" "}Ce bandeau restera visible tant que votre compte n’est pas validé.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex h-[34px] items-center rounded-[18px] px-4 text-[14px] font-bold bg-[#7069FA] text-white hover:bg-[#6660E4] disabled:opacity-60"
            >
              {resending ? "Renvoi…" : "Renvoyer l’email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
