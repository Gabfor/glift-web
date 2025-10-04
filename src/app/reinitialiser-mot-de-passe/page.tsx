"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PasswordField } from "@/components/forms/PasswordField";
import Spinner from "@/components/ui/Spinner";
import { createClientComponentClient } from "@/lib/supabase/client";

type Stage = "verify" | "reset" | "done" | "error";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [stage, setStage] = useState<Stage>("verify");
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams?.get("next") || "/compte#mes-informations";
  const accessToken = searchParams?.get("access_token") || "";
  const refreshToken = searchParams?.get("refresh_token") || "";
  const type = searchParams?.get("type") || "";

  const isEmailValid = email.trim() !== "";
  const isPasswordValid = password.trim().length >= 8;
  const isConfirmValid =
    confirmPassword.trim().length >= 8 && confirmPassword === password;

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
          Modification du mot de passe
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
          <>
            <div className="w-full max-w-[564px] mb-6">
              <div className="relative bg-[#E7F0FF] rounded-[12px] px-6 py-5 text-left">
                <span className="absolute left-0 top-0 h-full w-[4px] bg-[#4F78EF]" />
                <h2 className="text-[#2E3271] font-bold text-[16px] mb-2">
                  Modification de votre mot de passe
                </h2>
                <p className="text-[#4F78EF] font-semibold text-[13px] leading-relaxed">
                  Pour finaliser votre demande de modification de votre mot de passe, saisissez un nouveau mot de passe, puis
                  confirmez-le avant de cliquer sur « Enregistrer ».
                </p>
              </div>
            </div>

            <form
              className="flex flex-col items-center w-full gap-[20px]"
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
                  disabled
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-[#F2F1F6] text-[#D7D4DC] border border-[#D7D4DC] cursor-not-allowed"
                />
              </div>

              <PasswordField
                id="password"
                name="new-password"
                label="Nouveau mot de passe"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                validate={(value) => value.trim().length >= 8}
                errorMessage="Le mot de passe doit contenir au moins 8 caractères."
                successMessage=""
                containerClassName="w-full max-w-[368px]"
              />

              <PasswordField
                id="confirm"
                name="confirm-password"
                label="Répéter le nouveau mot de passe"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                validate={(value) =>
                  value.trim().length >= 8 && value === password
                }
                errorMessage="Les mots de passe ne correspondent pas."
                successMessage=""
                containerClassName="w-full max-w-[368px]"
              />

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
                    "Enregistrer"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
