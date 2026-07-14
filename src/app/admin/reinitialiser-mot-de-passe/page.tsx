"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  const textColor = valid ? "text-[#00D591]" : "text-[#C2BFC6]";

  return (
    <div className="flex items-center justify-between">
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
      className="mt-3 space-y-2 rounded-[8px] bg-white px-4 py-3 text-[12px] text-[#5D6494]"
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

export default function AdminResetPasswordPage() {
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

  const next = searchParams?.get("next") || "/admin";
  const isEmailValid = email.trim() !== "";
  const isPasswordValid = passwordValidation.isValid;
  const isConfirmValid = confirmValidation.isValid;

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
      (event, _session) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user) {
              handleRecoverySession({ user: data.user });
            }
          });
        }
      }
    );

    const verifySession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          throw error;
        }

        if (data.user?.email) {
          handleRecoverySession({ user: data.user });
        } else if (!cancelled) {
          errorTimeout = setTimeout(() => {
            setStage((current) => (current === "verify" ? "error" : current));
          }, 2000);
        }
      } catch (unknownError) {
        console.error("Erreur lors de la vérification du lien admin", unknownError);
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
  }, [stage, supabase]);

  const isFormValid = isEmailValid && isPasswordValid && isConfirmValid;
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
        console.error("Erreur lors de la déconnexion après réinitialisation admin", signOutError);
      }

      setStage("done");
      setFormError(null);

      const params = new URLSearchParams({ reset: "success" });
      const isNextSafe = next.startsWith("/") && !next.startsWith("//");
      if (isNextSafe) {
        params.set("next", next);
      }

      const loginUrl = `/connexion${params.toString() ? `?${params.toString()}` : ""}`;

      window.setTimeout(() => {
        router.push(loginUrl);
        router.refresh();
      }, 600);
    } catch (unknownError) {
      console.error("Erreur lors de la mise à jour du mot de passe admin", unknownError);
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
      if (!hasCheckedSession) {
        return;
      }

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (signOutError) {
        console.error(
          "Erreur lors de la déconnexion après soumission admin",
          signOutError
        );
      }
    }
  };

  const showLoader = useMinimumVisibility(stage === "verify" || stage === "done");
  const handleLoaderShow = useCallback(() => {
    router.refresh();
  }, [router]);
  const loader = showLoader ? <GliftLoader onShow={handleLoaderShow} isAdmin /> : null;

  return (
    <>
      {loader}
      <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px]">
        <div className="w-full flex flex-col items-center px-4 sm:px-0">
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[24px]">
            Modification du mot de passe Admin
          </h1>

          {stage === "error" && (
            <div className="w-[564px] max-w-full mx-auto mb-6">
              <ModalMessage
                variant="warning"
                title="Lien invalide ou expiré"
                description="Merci de relancer une demande depuis « Mot de passe oublié ? » sur l'interface d'administration."
              />
            </div>
          )}

          {stage === "done" && (
            <div className="w-[564px] max-w-full mx-auto mb-6">
              <ModalMessage
                variant="success"
                title="Mot de passe modifié !"
                description="Votre nouveau mot de passe administrateur a bien été enregistré. Redirection en cours..."
              />
            </div>
          )}

          {stage === "reset" && (
            <form
              className="flex flex-col w-full max-w-[564px] gap-4"
              onSubmit={handleSubmit}
            >
              {formError && <ErrorMessage title={formError} />}

              {email && (
                <div className="text-center text-[14px] font-semibold text-[#5D6494] mb-2">
                  Compte : {email}
                </div>
              )}

              <div className="flex flex-col gap-0">
                <div className="w-full flex justify-center">
                  <PasswordField
                    id="password"
                    value={password}
                    onChange={setPassword}
                    label="Nouveau mot de passe"
                    containerClassName="w-full max-w-[368px]"
                    messageContainerClassName="mt-2 text-[13px] font-medium"
                    criteriaRenderer={passwordCriteriaRenderer}
                    autoComplete="new-password"
                  />
                </div>

                <div className="w-full flex justify-center">
                  <PasswordField
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    label="Confirmer le mot de passe"
                    containerClassName="w-full max-w-[368px]"
                    messageContainerClassName="mt-2 text-[13px] font-medium"
                    criteriaRenderer={confirmCriteriaRenderer}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="w-full flex justify-center mt-[15px]">
                <CTAButton
                  type="submit"
                  className="w-full max-w-[200px] font-semibold"
                  disabled={!isFormValid || submitting}
                  loading={submitting}
                  loadingText="Enregistrement..."
                >
                  <>
                    <Image
                      src="/icons/cadena_defaut.svg"
                      alt="Cadenas"
                      width={20}
                      height={20}
                      className={isFormValid && !submitting ? "invert brightness-0" : ""}
                    />
                    Enregistrer
                  </>
                </CTAButton>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
