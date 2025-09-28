"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ForgotPasswordButtonWithModal from "@/components/auth/ForgotPasswordButtonWithModal";
import Tooltip from "@/components/Tooltip";
import Spinner from "@/components/ui/Spinner";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorCode, setErrorCode] = useState<null | "invalid_credentials" | "generic">(null);
  const [submitting, setSubmitting] = useState(false);

  const search = useSearchParams();
  const resetSuccess = search?.get("reset") === "success";

  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const shouldShowEmailError =
    emailTouched && !emailFocused && email.trim() !== "" && !isEmailValidFormat;
  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const loginPageHash = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.hash || "";
  }, []);

  const nextTarget = useMemo(() => {
    const nextQ = search?.get("next") || "/entrainements";
    return `${nextQ}${loginPageHash}`;
  }, [search, loginPageHash]);

  // Nettoyage legacy localStorage Supabase
  const purgeLegacySupabaseLocalStorage = () => {
    try {
      if (typeof window === "undefined") return;
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("sb-") && k.includes("-auth-token")) keys.push(k);
      }
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch {}
  };

  const canUseCredMgmt =
    typeof window !== "undefined" &&
    !!(navigator as any).credentials &&
    (window.isSecureContext ?? window.location.hostname === "localhost");

  // Tentative d’auto-remplissage via Credential Management API
  useEffect(() => {
    (async () => {
      try {
        if (!canUseCredMgmt) return;
        const nav: any = navigator;
        const cred: any = await nav.credentials.get({
          password: true,
          mediation: "optional",
        } as any);
        if (cred && typeof cred === "object") {
          if ("id" in cred && typeof cred.id === "string") setEmail(cred.id);
          if ("password" in cred && typeof cred.password === "string") {
            setPassword(cred.password);
          }
        }
      } catch {}
    })();
  }, [canUseCredMgmt]);

  const maybeStoreCredentials = async (id: string, pwd: string) => {
    try {
      if (!canUseCredMgmt) return;
      const w: any = window;
      const nav: any = navigator;
      const PasswordCredentialClass = w.PasswordCredential;
      if (PasswordCredentialClass && nav.credentials?.store) {
        const cred = new PasswordCredentialClass({ id, password: pwd });
        await nav.credentials.store(cred);
      }
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorCode(null);
    setSubmitting(true);

    try {
      const remember = rememberMe ? "1" : "0";
      document.cookie = `sb-remember=${remember}; Path=/; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`;
      if (remember === "0") {
        document.cookie = `sb-session-tab=1; Path=/; SameSite=Lax${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`;
        purgeLegacySupabaseLocalStorage();
      }

      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message === "Invalid login credentials") {
          setErrorCode("invalid_credentials");
        } else {
          setErrorCode("generic");
        }
        setSubmitting(false);
        return;
      }

      if (data?.session) {
        if (rememberMe) await maybeStoreCredentials(email, password);

        try {
          const ac = new AbortController();
          const t = setTimeout(() => ac.abort(), 5000);
          await fetch("/auth/callback", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              event: "SIGNED_IN",
              session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              },
              remember,
            }),
            credentials: "include",
            keepalive: true,
            signal: ac.signal,
          });
          clearTimeout(t);
        } catch {}

        window.location.href = nextTarget;
        return;
      }

      window.location.href = nextTarget;
    } catch {
      setErrorCode("generic");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[24px]">
          Connexion
        </h1>

        {errorCode && (
          <div className="w-[564px] mb-6">
            <div className="relative bg-[#FFE3E3] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#EF4F4E]" />
              <h3 className="text-[#B42318] font-bold text-[12px]">
                {errorCode === "invalid_credentials"
                  ? "Adresse email ou mot de passe incorrect"
                  : "Une erreur est survenue"}
              </h3>
              <p className="text-[#EF4F4E] font-semibold text-[12px] leading-relaxed">
                {errorCode === "invalid_credentials"
                  ? "Nous n’arrivons pas à vous connecter. Veuillez vérifier qu’il s’agit bien de l’email utilisé lors de l’inscription ou qu’il n’y a pas d’erreur dans le mot de passe."
                  : "Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support."}
              </p>
            </div>
          </div>
        )}

        {resetSuccess && (
          <div className="w-[564px] mb-6">
            <div className="relative bg-[#E3F9E5] rounded-[5px] px-5 py-2.5 text-left">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#57AE5B]" />
              <h3 className="text-[#207227] font-bold text-[12px]">
                Mot de passe modifié avec succès&nbsp;!
              </h3>
              <p className="text-[#57AE5B] font-semibold text-[12px] leading-relaxed">
                Bonne nouvelle&nbsp;! Votre mot de passe a bien été modifié.
                Vous pouvez dès à présent vous connecter en utilisant votre
                nouveau mot de passe.
              </p>
            </div>
          </div>
        )}

        <form
          className="flex flex-col items-center w-full"
          onSubmit={handleLogin}
          autoComplete="on"
          name="login"
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
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => {
                setEmailFocused(false);
                setEmailTouched(true);
              }}
              className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150
              ${
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
                Mot de passe
              </label>
              <ForgotPasswordButtonWithModal
                variant="link"
                triggerLabel="Mot de passe oublié ?"
                prefillEmail={email}
                triggerClassName="!text-[12px] pt-[6px] pb-[2px]"
              />
            </div>

            <input
              id="password"
              name="current-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
            />
            <Tooltip
              content={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              offset={12}
              offsetX={1}
              delay={250}
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[41px] cursor-pointer"
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                <Image
                  src={
                    showPassword
                      ? "/icons/masque_defaut.svg"
                      : "/icons/visible_defaut.svg"
                  }
                  alt=""
                  width={25}
                  height={25}
                />
                <span className="sr-only">
                  {showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"}
                </span>
              </button>
            </Tooltip>
          </div>

          <div className="max-w-[368px] mb-[20px] w-full">
            <label
              htmlFor="remember"
              className="flex items-center gap-2 cursor-pointer text-[14px] font-semibold text-[#5D6494]"
            >
              <div className="relative w-[15px] h-[15px] shrink-0 mt-[1px]">
                <input
                  id="remember"
                  type="checkbox"
                  name="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <Image
                  src="/icons/checkbox_unchecked.svg"
                  alt=""
                  aria-hidden="true"
                  width={15}
                  height={15}
                  className="absolute inset-0 w-[15px] h-[15px] peer-checked:hidden"
                />
                <Image
                  src="/icons/checkbox_checked.svg"
                  alt=""
                  aria-hidden="true"
                  width={15}
                  height={15}
                  className="absolute inset-0 w-[15px] h-[15px] hidden peer-checked:block"
                />
              </div>
              Je veux rester connecté.
            </label>
          </div>

          <div className="w-full flex justify-center">
            <button
              type="submit"
              disabled={!isFormValid}
              aria-busy={submitting}
              className={`inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold
                ${
                  !isFormValid
                    ? "bg-[#F2F1F6] text-[#D7D4DC] cursor-not-allowed"
                    : "bg-[#7069FA] text-white hover:bg-[#6660E4]"
                }
              `}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="md" ariaLabel="En cours" />
                  En cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </div>

          <p className="mt-[20px] text-sm font-semibold text-[#5D6494] text-center">
            Pas encore inscrit ?{" "}
            <Link
              href="/inscription"
              className="text-[#7069FA] hover:text-[#6660E4]"
            >
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
