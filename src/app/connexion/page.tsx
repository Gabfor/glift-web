"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CTAButton from "@/components/CTAButton";
import { EmailField, isValidEmail } from "@/components/forms/EmailField";
import { PasswordField } from "@/components/forms/PasswordField";
import { createClientComponentClient } from "@/lib/supabase/client";
import { IconCheckbox } from "@/components/ui/IconCheckbox";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import ModalMessage from "@/components/ui/ModalMessage";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";


export default function ConnexionPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<
    | {
      type:
      | "invalid-email"
      | "invalid-credentials"
      | "email-not-confirmed"
      | "generic";
      title: string;
      description?: string;
    }
    | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTransitionLoader, setShowTransitionLoader] = useState(false);
  const showLoader = useMinimumVisibility(showTransitionLoader);
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClientComponentClient();

  const isEmailValidFormat = isValidEmail(email);
  const isFormValid = isEmailValidFormat && password.trim() !== "";

  const resetStatus = searchParams?.get("reset") ?? null;
  const rawNextParam = searchParams?.get("next") ?? null;

  const decodedNextParam = useMemo(() => {
    if (!rawNextParam) {
      return null;
    }

    try {
      return decodeURIComponent(rawNextParam);
    } catch (decodeError) {
      console.warn("[connexion] Unable to decode next parameter", decodeError);
      return rawNextParam;
    }
  }, [rawNextParam]);

  const sanitizedNextParam = useMemo(() => {
    if (!decodedNextParam) {
      return null;
    }

    if (!decodedNextParam.startsWith("/") || decodedNextParam.startsWith("//")) {
      return null;
    }

    return decodedNextParam;
  }, [decodedNextParam]);

  const [showResetSuccess, setShowResetSuccess] = useState(
    resetStatus === "success"
  );

  const handleTransitionLoaderShow = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (resetStatus === "success") {
      setShowResetSuccess(true);

      if (!searchParams) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.delete("reset");

      const query = params.toString();
      router.replace(`/connexion${query ? `?${query}` : ""}`);
    }
  }, [resetStatus, searchParams, router]);

  const persistRememberPreference = (value: boolean) => {
    const cookieName = "glift-remember";

    // Supprime la valeur précédente pour éviter les attributs périmés (ex: Max-Age)
    document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;

    const segments = [
      `${cookieName}=${value ? "1" : "0"}`,
      "Path=/",
      "SameSite=Lax",
    ];

    if (value) {
      // 1 an de persistance
      segments.push(`Max-Age=${60 * 60 * 24 * 365}`);
    }

    document.cookie = segments.join("; ");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!isEmailValidFormat) {
      setError({ type: "invalid-email", title: "Format d’adresse invalide" });
      return;
    }

    setError(null);
    setLoading(true);

    try {
      persistRememberPreference(rememberMe);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        if (data?.session) {
          await supabase.auth.setSession(data.session);
        }
        setShowTransitionLoader(true);
        router.push(sanitizedNextParam ?? "/dashboard");
        router.refresh();
      } else if (error.message === "Invalid login credentials") {
        setError({
          type: "invalid-credentials",
          title: "Email ou mot de passe incorrect",
          description:
            "Nous n’arrivons pas à vous connecter. Veuillez vérifier qu’il s’agit bien de l’email utilisé lors de l’inscription ou qu’il n’y a pas d’erreur dans le mot de passe.",
        });
      } else {
        setError({
          type: "generic",
          title: "Une erreur est survenue.",
          description:
            "Nous n'avons pas réussi à vous connecter. Rechargez la page ou réessayez dans quelques instants.",
        });
      }
    } catch (unknownError) {
      console.error("Erreur lors de la connexion", unknownError);
      setError({
        type: "generic",
        title: "Une erreur est survenue.",
        description:
          "Nous n'avons pas réussi à vous connecter. Rechargez la page ou réessayez dans quelques instants.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      {showLoader ? <GliftLoader onShow={handleTransitionLoaderShow} /> : null}
      <div className="w-full max-w-[564px] flex flex-col items-center">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-6">
          Connexion
        </h1>

        <form className="flex flex-col w-full gap-4" onSubmit={handleLogin}>
          {showResetSuccess ? (
            <ModalMessage
              variant="success"
              title="Mot de passe modifié avec succès !"
              description="Bonne nouvelle ! Votre mot de passe a bien été modifié. Vous pouvez dès à présent vous connecter en utilisant votre nouveau mot de passe."
            />
          ) : null}

          {error && error.type !== "invalid-email" ? (
            <ErrorMessage title={error.title} description={error.description} />
          ) : null}

          <div className="flex flex-col gap-0">
            {/* Email */}
            <div className="w-full flex justify-center">
              <EmailField
                id="email"
                label="Email"
                value={email}
                onChange={(nextEmail) => {
                  setEmail(nextEmail);
                  if (error?.type === "invalid-email") {
                    setError(null);
                  }
                }}
                externalError={error?.type === "invalid-email" ? error.title : null}
                containerClassName="w-full max-w-[368px]"
                messageContainerClassName="mt-2 text-[13px] font-medium"
                hideSuccessMessage
                autoComplete="email"
              />
            </div>

            {/* Mot de passe */}
            <div className="w-full flex justify-center">
              <PasswordField
                id="password"
                value={password}
                onChange={(nextPassword) => {
                  setPassword(nextPassword);
                  if (error && error.type !== "invalid-email") {
                    setError(null);
                  }
                }}
                label="Mot de passe"
                labelAction={
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[#7069FA] text-[10px] pt-[6px] font-medium hover:text-[#6660E4]"
                  >
                    Mot de passe oublié ?
                  </button>
                }
                containerClassName="w-full max-w-[368px]"
                messageContainerClassName="mt-2 text-[13px] font-medium"
                autoComplete="current-password"
              />
            </div>
            {/* Checkbox */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[368px] mb-[10px]">
                <label className="flex items-center gap-2 cursor-pointer text-[14px] font-semibold text-[#5D6494]">
                  <IconCheckbox
                    name="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size={15}
                  />
                  Je veux rester connecté.
                </label>
              </div>
            </div>
          </div>

          {/* Bouton Se connecter */}
          <div className="w-full flex justify-center">
            <CTAButton
              type="submit"
              className="w-full max-w-[160px] font-semibold"
              disabled={!isFormValid}
              loading={loading}
              loadingText="En cours..."
            >
              <>
                <Image
                  src="/icons/cadena_defaut.svg"
                  alt="Icône cadenas"
                  width={20}
                  height={20}
                  className={`transition-colors ${isFormValid && !loading ? "invert brightness-0" : ""
                    }`}
                />
                Se connecter
              </>
            </CTAButton>
          </div>

          {/* Lien inscription */}
          <p className="mt-[20px] text-sm font-semibold text-[#5D6494] text-center">
            Pas encore inscrit ?{" "}
            <Link href="/tarifs" className="text-[#7069FA] hover:text-[#6660E4]">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </main>
  );
}
