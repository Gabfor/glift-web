"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { EmailField, isValidEmail } from "@/components/forms/EmailField";
import { PasswordField } from "@/components/forms/PasswordField";
import { createClientComponentClient } from "@/lib/supabase/client";
import { IconCheckbox } from "@/components/ui/IconCheckbox";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<
    | {
        type: "invalid-email" | "invalid-credentials" | "generic";
        title: string;
        description?: string;
      }
    | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();

  const supabase = createClientComponentClient();

  const isEmailValidFormat = isValidEmail(email);
  const isFormValid = isEmailValidFormat && password.trim() !== "";

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
        router.push("/entrainements");
        router.refresh();
      } else if (error.message === "Invalid login credentials") {
        setError({
          type: "invalid-credentials",
          title: "Adresse email ou mot de passe incorrect",
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

  const buttonStateClasses = loading
    ? "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed"
    : isFormValid
    ? "bg-[#7069FA] text-white hover:bg-[#6660E4] cursor-pointer"
    : "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed";

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-[564px] flex flex-col items-center">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-6">
          Connexion
        </h1>

        <form className="flex flex-col w-full gap-4" onSubmit={handleLogin}>
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
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full max-w-[160px] h-[44px] rounded-[25px] text-[16px] font-bold text-center transition flex items-center justify-center gap-2 ${buttonStateClasses}`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 text-[15px]">
                  <Spinner size="md" ariaLabel="Connexion en cours" />
                  En cours
                </span>
              ) : (
                <>
                  <Image
                    src="/icons/cadena_defaut.svg"
                    alt="Icône cadenas"
                    width={20}
                    height={20}
                    className={`transition-colors ${
                      isFormValid ? "invert brightness-0" : ""
                    }`}
                  />
                  Se connecter
                </>
              )}
            </button>
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
