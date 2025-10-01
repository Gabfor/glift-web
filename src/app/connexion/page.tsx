"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase/client";
import { IconCheckbox } from "@/components/ui/IconCheckbox";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<
    | { type: "invalid-email" | "invalid-credentials" | "generic"; title: string; description?: string }
    | null
  >(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createClientComponentClient();

  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const shouldShowEmailError =
    emailTouched && !emailFocused && email.trim() !== "" && !isEmailValidFormat;
  const showEmailFieldError = shouldShowEmailError || error?.type === "invalid-email";

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) {
      return;
    }
    if (!isEmailValidFormat) {
      setEmailTouched(true);
      setError({ type: "invalid-email", title: "Format d’adresse invalide" });
      return;
    }
    setError(null);
    setLoading(true);

    try {
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
          title: "Email ou mot de passe incorrect.",
        });
      } else {
        setError({
          type: "generic",
          title: "Une erreur est survenue.",
        });
      }
    } catch (unknownError) {
      console.error("Erreur lors de la connexion", unknownError);
      setError({
        type: "generic",
        title: "Une erreur est survenue.",
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
      <div className="w-full max-w-[564px] flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-6">
          Connexion
        </h1>

        <form className="flex flex-col items-start w-full gap-6" onSubmit={handleLogin}>
          {error ? (
            <ErrorMessage title={error.title} description={error.description} />
          ) : null}

          {/* Email */}
          <div className="w-full max-w-[368px]">
            <label htmlFor="email" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error?.type === "invalid-email") {
                  setError(null);
                }
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => {
                setEmailFocused(false);
                setEmailTouched(true);
                if (!isEmailValidFormat && email.trim() !== "") {
                  setError({ type: "invalid-email", title: "Format d’adresse invalide" });
                } else if (error?.type === "invalid-email") {
                  setError(null);
                }
              }}
              className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150
              ${showEmailFieldError
                ? "border border-[#EF4444]"
                : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"}`}
            />
          </div>

          {/* Mot de passe */}
          <div className="w-full max-w-[368px] mb-[20px] relative">
            <label htmlFor="password" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
              Mot de passe
              <Link
                href="/mot-de-passe-oublie"
                className="float-right text-[#7069FA] text-[10px] pt-[6px] font-medium hover:text-[#6660E4]"
              >
                Mot de passe oublié ?
              </Link>
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error && error.type !== "invalid-email") {
                  setError(null);
                }
              }}
              className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[39px] cursor-pointer"
            >
              <Image
                src={showPassword ? "/icons/masque_defaut.svg" : "/icons/visible_defaut.svg"}
                alt={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                width={25}
                height={25}
              />
            </button>
          </div>

          {/* Checkbox */}
          <div className="max-w-[368px] mb-[20px] w-full">
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
                    className={`transition-colors ${isFormValid ? "invert brightness-0" : ""}`}
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
    </main>
  );
}
