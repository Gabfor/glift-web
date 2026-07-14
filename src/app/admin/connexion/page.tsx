"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CTAButton from "@/components/CTAButton";
import { EmailField, isValidEmail } from "@/components/forms/EmailField";
import { PasswordField } from "@/components/forms/PasswordField";
import { createClientComponentClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import ModalMessage from "@/components/ui/ModalMessage";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import { IconCheckbox } from "@/components/ui/IconCheckbox";

export default function AdminConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<{
    type: "invalid-email" | "invalid-credentials" | "unauthorized" | "generic";
    title: string;
    description?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTransitionLoader, setShowTransitionLoader] = useState(false);

  const persistRememberPreference = (value: boolean) => {
    const cookieName = "glift-remember";
    document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
    const segments = [
      `${cookieName}=${value ? "1" : "0"}`,
      "Path=/",
      "SameSite=Lax",
    ];
    if (value) {
      segments.push(`Max-Age=${60 * 60 * 24 * 365}`);
    }
    document.cookie = segments.join("; ");
  };
  const showLoader = useMinimumVisibility(showTransitionLoader);
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClientComponentClient();

  const isEmailValidFormat = isValidEmail(email);
  const isFormValid = isEmailValidFormat && password.trim() !== "";

  const resetStatus = searchParams?.get("reset") ?? null;

  const [showResetSuccess, setShowResetSuccess] = useState(
    resetStatus === "success"
  );

  const handleTransitionLoaderShow = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (resetStatus === "success") {
      setShowResetSuccess(true);
      if (!searchParams) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("reset");
      const query = params.toString();
      router.replace(`/connexion${query ? `?${query}` : ""}`);
    }
  }, [resetStatus, searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!isEmailValidFormat) {
      setError({ type: "invalid-email", title: "Format d’adresse invalide" });
      return;
    }

    setError(null);
    setLoading(true);
    console.log("[ADMIN LOGIN] Form submitted. Attempting signInWithPassword...");

    try {
      persistRememberPreference(rememberMe);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[ADMIN LOGIN] signInWithPassword finished. Error:", signInError?.message, "User:", data.user?.email);

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError({
            type: "invalid-credentials",
            title: "Email ou mot de passe incorrect",
            description: "Nous n’arrivons pas à vous connecter. Veuillez vérifier vos identifiants administrateur.",
          });
        } else {
          setError({
            type: "generic",
            title: "Une erreur est survenue.",
            description: "Nous n'avons pas réussi à vous connecter. Rechargez la page ou réessayez dans quelques instants.",
          });
        }
        setLoading(false);
        return;
      }

      // Vérification des droits administrateur
      const isAdmin = data.user?.user_metadata?.is_admin === true;
      console.log("[ADMIN LOGIN] User role check - isAdmin:", isAdmin);

      if (!isAdmin) {
        console.log("[ADMIN LOGIN] User is not admin. Logging out...");
        // Déconnecter immédiatement
        await supabase.auth.signOut({ scope: "local" });
        setError({
          type: "unauthorized",
          title: "Accès refusé",
          description: "Ce compte ne possède pas les droits requis pour accéder à l'administration.",
        });
        setLoading(false);
        return;
      }

      console.log("[ADMIN LOGIN] User is admin. Setting session...");
      setShowTransitionLoader(true);
      if (data?.session) {
        await supabase.auth.setSession(data.session);
      }
      console.log("[ADMIN LOGIN] Session set. Redirecting to '/'...");
      window.location.href = "/";
    } catch (unknownError) {
      console.error("[ADMIN LOGIN] Unexpected error caught:", unknownError);
      setError({
        type: "generic",
        title: "Une erreur est survenue.",
        description: "Une erreur inattendue est survenue. Veuillez réessayer.",
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px]">
      {showLoader ? <GliftLoader onShow={handleTransitionLoaderShow} isAdmin /> : null}
      <div className="w-full max-w-[564px] flex flex-col items-center">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-6">
          Admin
        </h1>

        <form className="flex flex-col w-full gap-4" onSubmit={handleLogin}>
          {showResetSuccess ? (
            <ModalMessage
              variant="success"
              title="Mot de passe modifié avec succès !"
              description="Bonne nouvelle ! Votre mot de passe administrateur a bien été modifié. Vous pouvez dès à présent vous connecter."
            />
          ) : null}

          {error && error.type !== "invalid-email" ? (
            <ErrorMessage
              title={error.title}
              description={error.description}
            />
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
                  className={`transition-colors ${isFormValid && !loading ? "invert brightness-0" : ""}`}
                />
                Se connecter
              </>
            </CTAButton>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        resetPath="/reinitialiser-mot-de-passe"
      />
    </main>
  );
}
