"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { parse } from "cookie";

import {
  PasswordField,
  getPasswordValidationState,
} from "@/components/forms/PasswordField";
import Spinner from "@/components/ui/Spinner";
import ModalMessage from "@/components/ui/ModalMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { createClientComponentClient } from "@/lib/supabase/client";
import { AuthApiError } from "@supabase/supabase-js";

type Stage = "verify" | "reset" | "done" | "error";

type SessionTokenSet = {
  accessToken: string;
  refreshToken: string;
  type: string;
};

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
  const [sessionTokens, setSessionTokens] = useState<SessionTokenSet | null>(null);

  const passwordValidation = useMemo(
    () => getPasswordValidationState(password),
    [password]
  );

  const confirmValidation = useMemo(() => {
    const base = getPasswordValidationState(confirmPassword);
    const matches =
      confirmPassword.trim().length > 0 && confirmPassword === password;

    return {
      ...base,
      matches,
      isValid: base.isValid && matches,
    };
  }, [confirmPassword, password]);

  const next = searchParams?.get("next") || "/compte#mes-informations";
  const accessToken = searchParams?.get("access_token") || "";
  const refreshToken = searchParams?.get("refresh_token") || "";
  const type = searchParams?.get("type") || "";
  const code = searchParams?.get("code") || "";
  const codeVerifierParam = searchParams?.get("code_verifier") || "";

  const isEmailValid = email.trim() !== "";
  const isPasswordValid = passwordValidation.isValid;
  const isConfirmValid = confirmValidation.isValid;

  useEffect(() => {
    if (stage !== "verify") {
      return;
    }

    let cancelled = false;

    const isValidTokenSet = (
      tokenSet: Partial<SessionTokenSet> | null
    ): tokenSet is SessionTokenSet => {
      if (!tokenSet) return false;

      const validTypes = ["recovery", "signup", "magiclink"];

      return (
        Boolean(tokenSet.accessToken) &&
        Boolean(tokenSet.refreshToken) &&
        validTypes.includes(tokenSet.type ?? "")
      );
    };

    const extractTokensFromFragment = (): Partial<SessionTokenSet> | null => {
      if (typeof window === "undefined" || !window.location.hash) {
        return null;
      }

      if (!window.location.hash.includes("access_token")) {
        return null;
      }

      const params = new URLSearchParams(
        window.location.hash.replace("#", "")
      );

      return {
        accessToken: params.get("access_token") || "",
        refreshToken: params.get("refresh_token") || "",
        type: params.get("type") || "",
      };
    };

    const extractCodeFromFragment = (): string | null => {
      if (typeof window === "undefined" || !window.location.hash) {
        return null;
      }

      const params = new URLSearchParams(
        window.location.hash.replace("#", "")
      );

      return params.get("code");
    };

    const extractCodeVerifierFromFragment = (): string | null => {
      if (typeof window === "undefined" || !window.location.hash) {
        return null;
      }

      const params = new URLSearchParams(
        window.location.hash.replace("#", "")
      );

      return params.get("code_verifier");
    };

    const ensureCodeVerifierCookie = (codeVerifier: string) => {
      if (typeof document === "undefined" || !codeVerifier) {
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return;
      }

      let storageKey: string | null = null;
      try {
        const projectRef = new URL(supabaseUrl).hostname.split(".")[0] || "";
        if (!projectRef) {
          return;
        }
        storageKey = `sb-${projectRef}-auth-token-code-verifier`;
      } catch (urlError) {
        console.error(
          "Impossible de déterminer la clef de stockage Supabase",
          urlError,
        );
        return;
      }

      const existingCookies = parse(document.cookie ?? "");
      if (existingCookies?.[storageKey]) {
        return;
      }

      const toBase64Url = (value: string) =>
        typeof window === "undefined"
          ? value
          : window
              .btoa(value)
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");

      const value = `${codeVerifier}/PASSWORD_RECOVERY`;
      const encodedValue = `base64-${toBase64Url(value)}`;

      const segments = [
        `${storageKey}=${encodedValue}`,
        "Path=/",
        "SameSite=Lax",
        // Le code verifier n'a besoin d'être conservé que brièvement.
        "Max-Age=600",
      ];

      if (window.location.protocol === "https:") {
        segments.push("Secure");
      }

      document.cookie = segments.join("; ");
    };

    const verifyLink = async () => {
      try {
        let activeTokens: SessionTokenSet | null = null;
        let activeSessionEmail: string | null = null;
        let tokensSource: "existing-session" | "state" | "params" | "fragment" | null = null;

        const {
          data: existingSessionData,
          error: existingSessionError,
        } = await supabase.auth.getSession();

        if (existingSessionError) throw existingSessionError;

        const existingSession = existingSessionData?.session ?? null;

        if (
          existingSession?.access_token &&
          existingSession?.refresh_token &&
          (existingSession.type ?? type) === "recovery"
        ) {
          const candidateFromExistingSession: SessionTokenSet = {
            accessToken: existingSession.access_token,
            refreshToken: existingSession.refresh_token,
            type: "recovery",
          };

          if (isValidTokenSet(candidateFromExistingSession)) {
            activeTokens = candidateFromExistingSession;
            activeSessionEmail = existingSession.user?.email ?? null;
            tokensSource = "existing-session";
          }
        }

        if (!activeTokens && isValidTokenSet(sessionTokens)) {
          activeTokens = sessionTokens;
          tokensSource = "state";
        }

        if (!activeTokens) {
          const candidateFromParams: Partial<SessionTokenSet> = {
            accessToken,
            refreshToken,
            type,
          };

          if (isValidTokenSet(candidateFromParams)) {
            activeTokens = candidateFromParams;
            tokensSource = "params";
          }
        }

        if (!activeTokens) {
          const candidateFromFragment = extractTokensFromFragment();

          if (isValidTokenSet(candidateFromFragment)) {
            activeTokens = candidateFromFragment;
            tokensSource = "fragment";
          }
        }

        if (isValidTokenSet(activeTokens)) {
          if (!sessionTokens && !cancelled) {
            setSessionTokens(activeTokens);
          }

          if (tokensSource !== "existing-session") {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: activeTokens.accessToken,
              refresh_token: activeTokens.refreshToken,
            });
            if (sessionError) throw sessionError;
          }

          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;

          const userEmail = data?.user?.email ?? activeSessionEmail ?? "";
          if (!userEmail) {
            throw new Error("no-email");
          }

          if (!cancelled) {
            setEmail(userEmail);
            setStage("reset");
          }
        } else {
          let authCode = code;
          if (!authCode) {
            authCode = extractCodeFromFragment() || "";
          }

          if (!authCode) {
            throw new Error("invalid-link");
          }

          const codeVerifierFromUrl =
            codeVerifierParam || extractCodeVerifierFromFragment() || "";

          if (codeVerifierFromUrl) {
            ensureCodeVerifierCookie(codeVerifierFromUrl);
          }

          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) throw exchangeError;

          let userEmail = exchangeData?.user?.email ?? "";

          if (!userEmail) {
            const { data: userData, error: userError } =
              await supabase.auth.getUser();
            if (userError) throw userError;
            userEmail = userData?.user?.email ?? "";
          }

          if (!userEmail) {
            throw new Error("no-email");
          }

          if (!sessionTokens && !cancelled && exchangeData?.session) {
            setSessionTokens({
              accessToken: exchangeData.session.access_token,
              refreshToken: exchangeData.session.refresh_token,
              type: "recovery",
            });
          }

          if (!cancelled) {
            setEmail(userEmail);
            setStage("reset");
          }
        }
      } catch (unknownError) {
        console.error("Erreur lors de la vérification du lien", unknownError);
        if (!cancelled) {
          setStage("error");
        }
      }
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (signOutError) {
        console.error(
          "Erreur lors de la déconnexion après vérification",
          signOutError
        );
      }

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.hash = "";
        if (url.searchParams.has("code")) {
          url.searchParams.delete("code");
        }

        window.history.replaceState(
          null,
          "",
          `${url.pathname}${url.search}`
        );
      }
    };

    verifyLink();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    refreshToken,
    sessionTokens,
    stage,
    supabase,
    type,
    code,
    codeVerifierParam,
  ]);

  const isFormValid = isEmailValid && isPasswordValid && isConfirmValid;

  const PasswordCriteriaItem = ({
    valid,
    text,
  }: {
    valid: boolean;
    text: string;
  }) => {
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
  };

  const renderPasswordCriteria = (
    validation:
      | ReturnType<typeof getPasswordValidationState>
      | (ReturnType<typeof getPasswordValidationState> & { matches?: boolean }),
    options?: {
      includeMatch?: boolean;
    }
  ) => (
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
      {options?.includeMatch ? (
        <PasswordCriteriaItem
          valid={Boolean(
            "matches" in validation ? validation.matches : false
          )}
          text="Correspond au mot de passe"
        />
      ) : null}
    </div>
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !isFormValid) return;

    setSubmitting(true);
    setFormError(null);

    try {
      if (!sessionTokens) {
        throw new Error("missing-session");
      }

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: sessionTokens.accessToken,
        refresh_token: sessionTokens.refreshToken,
      });
      if (setSessionError) throw setSessionError;

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

      setStage("done");
      setFormError(null);

      const params = new URLSearchParams({ reset: "success" });
      const isNextSafe = next.startsWith("/") && !next.startsWith("//");
      if (isNextSafe) {
        params.set("next", next);
      }

      const loginUrl = `/connexion${
        params.toString() ? `?${params.toString()}` : ""
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
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (signOutError) {
        console.error(
          "Erreur lors de la déconnexion après soumission",
          signOutError
        );
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[24px]">
          Modification du mot de passe
        </h1>

        {stage === "verify" && (
          <div className="w-[564px] max-w-full mx-auto mb-6">
            <ModalMessage
              variant="info"
              title="Vérification…"
              description="Un instant, nous vérifions ton lien de réinitialisation."
            />
          </div>
        )}

        {stage === "error" && (
          <div className="w-[564px] max-w-full mx-auto mb-6">
            <ModalMessage
              variant="warning"
              title="Lien invalide ou expiré"
              description="Merci de relancer une demande depuis « Mot de passe oublié ? »."
            />
          </div>
        )}

        {stage === "done" && (
          <div className="w-[564px] max-w-full mx-auto mb-6">
            <ModalMessage
              variant="success"
              title="Mot de passe modifié avec succès !"
              description="Vous allez être redirigé vers la page de connexion pour utiliser votre nouveau mot de passe."
            />
          </div>
        )}

        {stage === "reset" && (
          <>
            <div className="w-[564px] max-w-full mx-auto mb-6">
              <ModalMessage
                variant="info"
                title="Modification de votre mot de passe"
                description="Pour finaliser votre demande de modification de votre mot de passe, saisissez un nouveau mot de passe, puis confirmez-le avant de cliquer sur « Enregistrer »."
                className="px-6 py-5"
              />
            </div>
            {formError ? (
              <div className="w-[564px] max-w-full mx-auto mb-6">
                <ErrorMessage title={formError} />
              </div>
            ) : null}

            <form
              className="flex flex-col items-center w-full max-w-[368px]"
              onSubmit={handleSubmit}
              autoComplete="on"
              name="reset-password"
            >
              {/* Email */}
              <div className="w-full mb-[30px]">
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

              {/* Nouveau mot de passe */}
              <div className="w-full mb-[5px]">
                <PasswordField
                  id="password"
                  name="new-password"
                  label="Nouveau mot de passe"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                  validate={(value) =>
                    getPasswordValidationState(value).isValid
                  }
                  errorMessage="Le mot de passe doit contenir au moins 8 caractères, une lettre, un chiffre et un symbole."
                  successMessage="Mot de passe conforme."
                  containerClassName="w-full"
                  messageContainerClassName="mt-[5px] text-[13px] font-medium"
                  criteriaRenderer={({ isFocused }) =>
                    isFocused ? renderPasswordCriteria(passwordValidation) : null
                  }
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
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  validate={(value) => {
                    const state = getPasswordValidationState(value);
                    return state.isValid && value === password;
                  }}
                  errorMessage="Les mots de passe doivent correspondre et respecter les critères ci-dessus."
                  successMessage="Confirmation valide."
                  containerClassName="w-full"
                  messageContainerClassName="mt-[5px] text-[13px] font-medium"
                  criteriaRenderer={({ isFocused }) =>
                    isFocused
                      ? renderPasswordCriteria(confirmValidation, {
                          includeMatch: true,
                        })
                      : null
                  }
                  blurDelay={100}
                />
              </div>

              {/* CTA */}
              <div className="w-full flex justify-center mt-[5px]">
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
