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
import { useDashboardUrl } from "@/hooks/useDashboardUrl";


export default function ConnexionPage() {
  const { contactUrl } = useDashboardUrl();
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<
    | {
      type:
      | "invalid-email"
      | "invalid-credentials"
      | "email-not-confirmed"
      | "grace-expired"
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

    if (searchParams?.get("error") === "grace-expired") {
      setError({
        type: "grace-expired",
        title: "Connexion impossible",
        description:
          "Nous sommes désolés mais il semblerait que tu n'aies pas validé ton email à temps. Ton compte a été désactivé et va être supprimé. Si c'est une erreur, contacte-nous.",
      });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
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
    console.log("[CLIENT LOGIN] Form submitted. Attempting signInWithPassword...");

    try {
      persistRememberPreference(rememberMe);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[CLIENT LOGIN] signInWithPassword finished. Error:", error?.message, "User:", data.user?.email);

      if (!error) {
        setShowTransitionLoader(true);
        // Validation de la période de grâce
        if (data.user?.id) {
          console.log("[CLIENT LOGIN] Fetching user profile from DB...");
          const { data: profile } = await supabase
            .from("profiles")
            .select("email_verified, grace_expires_at")
            .eq("id", data.user.id)
            .single();

          console.log("[CLIENT LOGIN] Profile fetched:", profile);

          if (
            profile &&
            profile.email_verified === false &&
            profile.grace_expires_at
          ) {
            const now = new Date();
            const graceExpiresAt = new Date(profile.grace_expires_at);

            if (graceExpiresAt < now) {
              console.log("[CLIENT LOGIN] Grace period expired!");
              // La période de grâce a expiré et l'email n'est pas vérifié
              await supabase.auth.signOut();
              setError({
                type: "grace-expired",
                title: "Délai de confirmation dépassé",
                description:
                  "Nous sommes désolés mais il semblerait que tu n'aies pas validé ton email à temps. Ton compte a été désactivé et va être supprimé. Si c'est une erreur, contacte-nous.",
              });
              setLoading(false);
              setShowTransitionLoader(false);
              return;
            }
          }
        }

        console.log("[CLIENT LOGIN] Setting session...");
        if (data?.session) {
          await supabase.auth.setSession(data.session);
        }
        console.log("[CLIENT LOGIN] Session set. Redirecting...");
        window.location.href = sanitizedNextParam ?? "/dashboard";
      } else if (error.message === "Invalid login credentials") {
        setError({
          type: "invalid-credentials",
          title: "Email ou mot de passe incorrect",
          description:
            "Nous n’arrivons pas à te connecter. Vérifie qu’il s’agit bien de l’email utilisé lors de ton inscription ou qu’il n’y a pas d’erreur dans le mot de passe.",
        });
        setLoading(false);
      } else {
        setError({
          type: "generic",
          title: "Une erreur est survenue.",
          description:
            "Nous n'avons pas réussi à te connecter. Recharge la page ou réessaie dans quelques instants.",
        });
        setLoading(false);
      }
    } catch (unknownError) {
      console.error("[CLIENT LOGIN] Unexpected error caught:", unknownError);
      setError({
        type: "generic",
        title: "Une erreur est survenue.",
        description:
          "Nous n'avons pas réussi à te connecter. Recharge la page ou réessaie dans quelques instants.",
      });
      setLoading(false);
    }
  };

  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(null);

  const handleOAuthSignIn = async (provider: "apple" | "google") => {
    try {
      setOauthLoading(provider);
      setError(null);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback${sanitizedNextParam ? `?next=${encodeURIComponent(sanitizedNextParam)}` : ""}`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (authError) {
        setError({
          type: "generic",
          title: "Erreur de connexion",
          description: authError.message || "Impossible de se connecter avec ce service.",
        });
        setOauthLoading(null);
      }
    } catch (err) {
      console.error("[oauth] error:", err);
      setError({
        type: "generic",
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de l'authentification.",
      });
      setOauthLoading(null);
    }
  };

  const AppleIcon = ({ className = "w-[20px] h-[20px]" }: { className?: string }) => (
    <svg viewBox="0 0 384 512" fill="currentColor" className={className}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );

  const GoogleIcon = ({ className = "w-[18px] h-[18px]" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[100px] md:pt-[140px]">
      {showLoader ? <GliftLoader onShow={handleTransitionLoaderShow} /> : null}
      <div className="w-full max-w-[564px] flex flex-col items-center">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-6">
          Connexion
        </h1>

        {showResetSuccess ? (
          <div className="w-[564px] max-w-full mb-6">
            <ModalMessage
              variant="success"
              title="Mot de passe modifié avec succès !"
              description="Bonne nouvelle ! Ton mot de passe a bien été modifié. Tu peux dès à présent te connecter en utilisant ton nouveau mot de passe."
            />
          </div>
        ) : null}

        {error && error.type !== "invalid-email" ? (
          <div className="w-[564px] max-w-full mb-6">
            <ErrorMessage
              title={error.title}
              description={
                error.type === "grace-expired" && error.description ? (
                  <span>
                    {error.description.split("contacte-nous").map((part, index, array) => (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <Link
                            href={contactUrl}
                            className="underline hover:text-[#C43636]"
                          >
                            contacte-nous
                          </Link>
                        )}
                      </span>
                    ))}
                  </span>
                ) : (
                  error.description
                )
              }
            />
          </div>
        ) : null}

        <form className="flex w-full max-w-[368px] flex-col items-stretch" onSubmit={handleLogin}>

          <div className="flex flex-col gap-0 w-full">
            {/* Email */}
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
              containerClassName="w-full"
              messageContainerClassName="mt-2 text-[13px] font-medium"
              hideSuccessMessage
              autoComplete="email"
            />

            {/* Mot de passe */}
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
              containerClassName="w-full"
              messageContainerClassName="mt-2 text-[13px] font-medium"
              autoComplete="current-password"
            />

            {/* Checkbox */}
            <div className="w-full mb-[10px]">
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

          {/* Bouton Se connecter */}
          <div className="w-full flex justify-center mt-[10px]">
            <CTAButton
              type="submit"
              className="w-full md:max-w-[160px] font-semibold"
              disabled={!isFormValid || oauthLoading !== null}
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

          <div className="relative my-[20px] flex items-center justify-center w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ECE9F1]" />
            </div>
            <div className="relative bg-[#FBFCFE] px-3 text-[14px] font-semibold text-[#D7D4DC]">
              ou continue avec
            </div>
          </div>

          <div className="flex flex-col gap-[20px] w-full items-center">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("apple")}
              disabled={oauthLoading !== null || loading}
              className="w-full h-[44px] px-6 rounded-full border border-[#D7D4DC] hover:border-[#C2BFC6] bg-white text-[#000000] font-semibold text-[15px] flex items-center justify-center transition-colors duration-150 disabled:opacity-60"
            >
              <div className="w-[20px] flex items-center justify-center shrink-0">
                <AppleIcon className="w-[17px] h-[20px] text-black" />
              </div>
              <div className="w-[210px] flex items-center justify-center text-center">
                <span className="whitespace-nowrap">Se connecter avec Apple</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={oauthLoading !== null || loading}
              className="w-full h-[44px] px-6 rounded-full border border-[#D7D4DC] hover:border-[#C2BFC6] bg-white text-[#000000] font-semibold text-[15px] flex items-center justify-center transition-colors duration-150 disabled:opacity-60"
            >
              <div className="w-[20px] flex items-center justify-center shrink-0">
                <GoogleIcon className="w-[18px] h-[18px]" />
              </div>
              <div className="w-[210px] flex items-center justify-center text-center">
                <span className="whitespace-nowrap">Se connecter avec Google</span>
              </div>
            </button>
          </div>

          {/* Lien inscription */}
          <p className="pt-[30px] text-sm font-semibold text-[#5D6494] text-center self-center">
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
        initialEmail={email}
      />
    </main>
  );
}
