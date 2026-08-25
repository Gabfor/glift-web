"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import CTAButton from "@/components/CTAButton";
import {
  PasswordField,
  getPasswordValidationState,
} from "@/components/forms/PasswordField";
import type { PasswordFieldProps } from "@/components/forms/PasswordField";
import ModalMessage from "@/components/ui/ModalMessage";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { createClientComponentClient } from "@/lib/supabase/client";
import { AuthApiError } from "@supabase/supabase-js";

type Stage = "verify" | "reset" | "done" | "error";

type CriteriaRenderer = NonNullable<PasswordFieldProps["criteriaRenderer"]>;
type PasswordValidationWithMatch = ReturnType<typeof getPasswordValidationState> & {
  matches?: boolean;
};

function PasswordCriteriaItem({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  const iconSrc = valid
    ? "/icons/check-success.svg"
    : "/icons/check-neutral.svg";
  const textColor = valid ? "text-[#00D591]" : "text-[#D7D4DC]";

  return (
    <div className="flex items-center justify-between font-semibold">
      <span className={textColor}>{text}</span>
      <Image
        src={iconSrc}
        alt={valid ? "Critère validé" : "Critère manquant"}
        width={16}
        height={16}
        className="h-[16px] w-[16px]"
      />
    </div>
  );
}

function PasswordCriteriaList({
  validation,
}: {
  validation: PasswordValidationWithMatch;
}) {
  return (
    <div
      className="mt-3 space-y-2 rounded-[8px] bg-white px-4 py-3 text-[12px] font-semibold text-[#5D6494]"
      style={{ boxShadow: "1px 1px 9px 1px rgba(0, 0, 0, 0.12)" }}
    >
      <PasswordCriteriaItem
        valid={validation.hasMinLength}
        text="Au moins 8 caractères"
      />
      <PasswordCriteriaItem valid={validation.hasLetter} text="Au moins 1 lettre" />
      <PasswordCriteriaItem valid={validation.hasNumber} text="Au moins 1 chiffre" />
      <PasswordCriteriaItem
        valid={validation.hasSymbol}
        text="Au moins 1 symbole"
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [stage, setStage] = useState<Stage>("verify");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  const passwordValidation = useMemo(
    () => getPasswordValidationState(password),
    [password]
  );

  const confirmValidation = useMemo<PasswordValidationWithMatch>(() => {
    const base = getPasswordValidationState(confirmPassword);
    const matches =
      confirmPassword.trim().length > 0 && confirmPassword === password;

    return {
      ...base,
      matches,
      isValid: base.isValid && matches,
    };
  }, [confirmPassword, password]);

  const next = searchParams?.get("next") || "/dashboard";
  const isEmailValid = email.trim() !== "";
  const isPasswordValid = passwordValidation.isValid;
  const isConfirmValid = confirmValidation.isValid;

  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (stage !== "verify") {
      return;
    }

    let cancelled = false;
    let errorTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleRecoverySession = (session: unknown) => {
      if (cancelled) {
        return;
      }

      const typedSession = session as
        | ({ user?: { email?: string | null } | null } & Record<string, unknown>)
        | null
        | undefined;
      const userEmail = typedSession?.user?.email ?? null;

      if (userEmail) {
        if (errorTimeout !== null) {
          window.clearTimeout(errorTimeout);
        }

        setEmail(userEmail);
        setStage("reset");
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          if (session?.user?.email) {
            handleRecoverySession({ user: session.user });
          } else {
            supabase.auth.getUser().then(({ data }) => {
              if (data?.user) {
                handleRecoverySession({ user: data.user });
              }
            });
          }
        }
      }
    );

    const verifySession = async () => {
      try {
        // 1. Essayer de récupérer l'utilisateur existant (s'il y a déjà une session active)
        let { data: initialData } = await supabase.auth.getUser();
        let user = initialData?.user ?? null;

        // 2. Si pas de session active mais qu'un code PKCE est présent dans l'URL, tenter l'échange
        if (!user) {
          const code = searchParams?.get("code");
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              throw exchangeError;
            }
            // Récupérer l'utilisateur après l'échange réussi
            const { data: postExchangeData, error: postExchangeError } = await supabase.auth.getUser();
            if (postExchangeError) {
              throw postExchangeError;
            }
            user = postExchangeData?.user ?? null;
          }
        }

        // 3. Valider qu'on a bien un utilisateur connecté ou un email de réinitialisation
        if (user?.email) {
          handleRecoverySession({ user });
        } else {
          const storedEmail = typeof window !== "undefined" ? sessionStorage.getItem("glift-reset-email") : null;
          if (storedEmail) {
            setEmail(storedEmail);
            setStage("reset");
          } else if (!cancelled) {
            setStage("error");
          }
        }
      } catch (unknownError) {
        console.error("Erreur lors de la vérification du lien", unknownError);
        if (!cancelled) {
          setStage("error");
        }
      } finally {
        if (!cancelled) {
          setHasCheckedSession(true);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
      if (errorTimeout !== null) {
        window.clearTimeout(errorTimeout);
      }
      authListener.subscription.unsubscribe();
    };
  }, [stage, supabase, searchParams]);

  const isFormValid = isPasswordValid && isConfirmValid;
  const passwordCriteriaRenderer = useCallback<CriteriaRenderer>(
    ({ isFocused }) =>
      isFocused ? (
        <PasswordCriteriaList validation={passwordValidation} />
      ) : null,
    [passwordValidation]
  );

  const confirmCriteriaRenderer = useCallback<CriteriaRenderer>(
    ({ isFocused }) =>
      isFocused ? (
        <PasswordCriteriaList validation={confirmValidation} />
      ) : null,
    [confirmValidation]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !isFormValid) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
      });
      if (signOutError) {
        console.error("Erreur lors de la déconnexion après réinitialisation", signOutError);
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("glift-reset-timestamp");
        sessionStorage.removeItem("glift-reset-email");
      }

      setStage("done");
      setFormError(null);

      const params = new URLSearchParams({ reset: "success" });
      const isNextSafe = next.startsWith("/") && !next.startsWith("//") && next !== "/dashboard";
      if (isNextSafe) {
        params.set("next", next);
      }

      const loginUrl = `/connexion${params.toString() ? `?${params.toString()}` : ""
        }`;

      window.setTimeout(() => {
        router.push(loginUrl);
        router.refresh();
      }, 600);
    } catch (unknownError) {
      console.error("Erreur lors de la mise à jour du mot de passe", unknownError);
      if (unknownError instanceof AuthApiError) {
        if (unknownError.status === 422 || unknownError.message) {
          const translatedMessage =
            unknownError.status === 422 &&
              unknownError.message ===
              "New password should be different from the old password."
              ? "Le nouveau mot de passe doit être différent de l'ancien."
              : unknownError.message ||
              "Une erreur est survenue lors de la mise à jour du mot de passe.";

          setFormError(translatedMessage);
          setStage("reset");
          return;
        }
      }

      setStage("error");
    } finally {
      setSubmitting(false);
    }
  };

  const showLoader = useMinimumVisibility(stage === "verify" || stage === "done");
  const handleLoaderShow = useCallback(() => {
    router.refresh();
  }, [router]);
  const loader = showLoader ? <GliftLoader onShow={handleLoaderShow} /> : null;

  return (
    <>
      {loader}
      <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[100px] md:pt-[140px]">
        <div className="w-full flex flex-col items-center px-4 sm:px-0">
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[24px]">
            Modification du mot de passe
          </h1>

          {stage === "error" && (
            <div className="w-[564px] max-w-full mx-auto mb-6">
              <ModalMessage
                variant="warning"
                title="Impossible de t’identifier"
                description="Nous sommes désolés mais nous n'avons pas réussi à t'identifier. Merci de relancer une demande depuis « Mot de passe oublié ? »."
              />
            </div>
          )}

          {stage === "reset" && (
            <>
              <div className="w-[564px] max-w-full mx-auto mb-6">
                <ModalMessage
                  variant="info"
                  title="Modification de ton mot de passe"
                  description="Pour finaliser ta demande, saisis un nouveau mot de passe sécurisé, puis confirme-le avant de cliquer sur « Enregistrer »."
                />
              </div>
              {formError ? (
                <div className="w-[564px] max-w-full mx-auto mb-6">
                  <ErrorMessage title={formError} />
                </div>
              ) : null}
            </>
          )}

          {(stage === "reset" || stage === "error") && (
            <form
              className="flex flex-col items-center w-full max-w-[368px]"
              onSubmit={handleSubmit}
              autoComplete="on"
              name="reset-password"
            >
              {/* Hidden username for accessibility and password managers */}
              <input type="hidden" name="username" value={email} autoComplete="username" />

              {/* Nouveau mot de passe */}
              <div className="w-full mb-[5px]">
                <PasswordField
                  id="password"
                  name="new-password"
                  label="Nouveau mot de passe"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={stage === "error"}
                  value={password}
                  onChange={setPassword}
                  validate={(value) =>
                    getPasswordValidationState(value).isValid
                  }
                  errorMessage="Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un symbole."
                  successMessage="Mot de passe valide"
                  containerClassName="w-full"
                  messageContainerClassName="mt-[5px] text-[13px] font-semibold"
                  criteriaRenderer={passwordCriteriaRenderer}
                  blurDelay={100}
                />
              </div>

              {/* Confirmation */}
              <div className="w-full mb-[5px]">
                <PasswordField
                  id="confirm"
                  name="confirm-password"
                  label="Répéter le nouveau mot de passe"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={stage === "error"}
                  onPaste={(e) => e.preventDefault()}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  validate={(value) => {
                    const state = getPasswordValidationState(value);
                    return state.isValid && value === password;
                  }}
                  errorMessage="Les mots de passe doivent correspondre et respecter les critères ci-dessus."
                  successMessage="Confirmation du mot de passe valide"
                  containerClassName="w-full"
                  messageContainerClassName="mt-[5px] text-[13px] font-semibold"
                  criteriaRenderer={confirmCriteriaRenderer}
                  blurDelay={100}
                />
              </div>

              {/* CTA */}
              <div className="w-full flex justify-center mt-[5px]">
                <CTAButton
                  type="submit"
                  className="w-full md:max-w-[160px] font-semibold"
                  disabled={stage === "error" || !isFormValid}
                  loading={submitting}
                  loadingText="En cours..."
                >
                  Enregistrer
                </CTAButton>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
