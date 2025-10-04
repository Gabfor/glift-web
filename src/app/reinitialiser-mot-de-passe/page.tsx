"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Spinner from "@/components/ui/Spinner";
import { createClientComponentClient } from "@/lib/supabase/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Stage = "verify" | "reset" | "done" | "error";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [stage, setStage] = useState<Stage>("verify");
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams?.get("next") || "/compte#mes-informations";
  const accessToken = searchParams?.get("access_token") || "";
  const refreshToken = searchParams?.get("refresh_token") || "";
  const type = searchParams?.get("type") || "";

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isPasswordValid = password.trim().length >= 8;
  const isConfirmValid = confirmPassword.trim() !== "" && confirmPassword === password;

  const shouldShowEmailError =
    emailTouched && !emailFocused && email.trim() !== "" && !isEmailValid;
  const shouldShowPasswordError =
    passwordTouched && !passwordFocused && password.trim() !== "" && !isPasswordValid;
  const shouldShowConfirmError =
    confirmTouched && !confirmFocused && confirmPassword.trim() !== "" && !isConfirmValid;

  useEffect(() => {
    let cancelled = false;

    const verifyLink = async () => {
      try {
        if (
          accessToken &&
          refreshToken &&
          ["recovery", "signup", "magiclink"].includes(type)
        ) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (
          typeof window !== "undefined" &&
          window.location.hash.includes("access_token")
        ) {
          const params = new URLSearchParams(
            window.location.hash.replace("#", ""),
          );
          const hashAccessToken = params.get("access_token");
          const hashRefreshToken = params.get("refresh_token");
          const hashType = params.get("type");

          if (
            hashType === "recovery" &&
            hashAccessToken &&
            hashRefreshToken
          ) {
            const { error } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            });
            if (error) throw error;
          } else {
            throw new Error("invalid-link");
          }
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const userEmail = data?.user?.email ?? "";
        if (!userEmail) {
          throw new Error("no-email");
        }

        if (!cancelled) {
          setEmail(userEmail);
          setStage("reset");
        }

        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
          );
        }
      } catch (unknownError) {
        console.error("Erreur lors de la vérification du lien", unknownError);
        if (!cancelled) {
          setStage("error");
        }
      }
    };

    verifyLink();

    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshToken, type, supabase]);

  const isFormValid = isEmailValid && isPasswordValid && isConfirmValid;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !isFormValid) {
      return;
    }

    setSubmitting(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }

      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        throw new Error("no-user");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        throw updateError;
      }

      setStage("done");

      window.setTimeout(() => {
        try {
          const destination = new URL(next);
          window.location.href = destination.toString();
        } catch {
          router.push(next);
          router.refresh();
        }
      }, 600);
    } catch (unknownError) {
      console.error("Erreur lors de la mise à jour du mot de passe", unknownError);
      setStage("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[24px]">
          Réinitialiser le mot de passe
        </h1>

        {stage === "verify" && (
          <div className="w-full max-w-[564px] mb-6">
            <div className="relative bg-[#E7F0FF] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#4F78EF]" />
              <h3 className="text-[#2E3271] font-bold text-[12px]">Vérification…</h3>
              <p className="text-[#4F78EF] font-semibold text-[12px] leading-relaxed">
                Un instant, nous vérifions ton lien de réinitialisation.
              </p>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="w-full max-w-[564px] mb-6">
            <div className="relative bg-[#FFE3E3] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#EF4F4E]" />
              <h3 className="text-[#B42318] font-bold text-[12px]">
                Lien invalide ou expiré
              </h3>
              <p className="text-[#EF4F4E] font-semibold text-[12px] leading-relaxed">
                Merci de relancer une demande depuis « Mot de passe oublié ? ».
              </p>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="w-full max-w-[564px] mb-6">
            <div className="relative bg-[#E8F8EE] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#31C48D]" />
              <h3 className="text-[#0F7A4A] font-bold text-[12px]">
                Mot de passe mis à jour
              </h3>
              <p className="text-[#0F7A4A] font-semibold text-[12px] leading-relaxed">
                Redirection en cours…
              </p>
            </div>
          </div>
        )}

        {stage === "reset" && (
          <form
            className="flex flex-col items-center w-full"
            onSubmit={handleSubmit}
            autoComplete="on"
            name="reset-password"
          >
            <div className="w-full max-w-[368px]">
              <label
                htmlFor="email"
                className="text-[16px] text-[#3A416F] font-bold mb-[5px] block"
              >
                Email
              </label>
              <input
                id="email"
                name="username"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="john.doe@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  setEmailTouched(true);
                }}
                className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${
                  shouldShowEmailError
                    ? "border border-[#EF4444]"
                    : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                }`}
              />
              <div className="h-[20px] mt-[5px] text-[13px] font-medium">
                {shouldShowEmailError && (
                  <p className="text-[#EF4444]">Format d’adresse invalide</p>
                )}
              </div>
            </div>

            <div className="w-full max-w-[368px] mb-[20px] relative">
              <div className="flex items-end justify-between mb-[5px]">
                <label
                  htmlFor="password"
                  className="text-[16px] text-[#3A416F] font-bold"
                >
                  Nouveau mot de passe
                </label>
              </div>
              <input
                id="password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => {
                  setPasswordFocused(false);
                  setPasswordTouched(true);
                }}
                className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
              />
              <div className="h-[20px] mt-[5px] text-[13px] font-medium">
                {shouldShowPasswordError && (
                  <p className="text-[#EF4444]">Mot de passe invalide</p>
                )}
              </div>
            </div>

            <div className="w-full max-w-[368px] mb-[20px] relative">
              <div className="flex items-end justify-between mb-[5px]">
                <label
                  htmlFor="confirm"
                  className="text-[16px] text-[#3A416F] font-bold"
                >
                  Confirmation
                </label>
              </div>
              <input
                id="confirm"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => {
                  setConfirmFocused(false);
                  setConfirmTouched(true);
                }}
                className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
              />
              <div className="h-[20px] mt-[5px] text-[13px] font-medium">
                {shouldShowConfirmError && (
                  <p className="text-[#EF4444]">
                    Mince, le mot de passe ne correspond pas…
                  </p>
                )}
              </div>
            </div>

            <div className="w-full flex justify-center">
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                aria-busy={submitting}
                className={`inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold ${
                  !isFormValid || submitting
                    ? "bg-[#F2F1F6] text-[#D7D4DC] cursor-not-allowed"
                    : "bg-[#7069FA] text-white hover:bg-[#6660E4]"
                }`}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="md" ariaLabel="En cours" />
                    En cours...
                  </span>
                ) : (
                  "Valider"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
