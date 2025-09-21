"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import Tooltip from "@/components/Tooltip";
import { createClient } from "@/lib/supabase/client";
import { nextStepPath } from "@/lib/onboarding";
import StepDots from "@/components/onboarding/StepDots";
import { postAuthCallback } from "@/lib/auth/postAuthCallback";

export default function InscriptionPage() {
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [prenomTouched, setPrenomTouched] = useState(false);
  const [prenomFocused, setPrenomFocused] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const pathname = usePathname() ?? "/inscription";
  const searchParams = useSearchParams();
  const supabase = createClient();

  // --- Validations
  const isPrenomFormatValid = /^[a-zA-ZÀ-ÿ\s-]+$/.test(prenom.trim());
  const isPrenomFieldValid = prenom.trim().length > 0 && isPrenomFormatValid;
  const shouldShowPrenomSuccess = prenomTouched && !prenomFocused && isPrenomFieldValid;
  const shouldShowPrenomError =
    prenomTouched && !prenomFocused && prenom.trim() !== "" && !isPrenomFormatValid;

  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const shouldShowEmailSuccess = emailTouched && !emailFocused && isEmailValidFormat;
  const shouldShowEmailError =
    emailTouched && !emailFocused && email.trim() !== "" && !isEmailValidFormat;

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValidFormat = hasMinLength && hasLetter && hasNumber && hasSymbol;
  const shouldShowPasswordSuccess = passwordTouched && !passwordFocused && isPasswordValidFormat;
  const shouldShowPasswordError =
    passwordTouched && !passwordFocused && password !== "" && !isPasswordValidFormat;

  const isFormValid = accepted && isPrenomFieldValid && isEmailValidFormat && isPasswordValidFormat;

  const resetForm = () => {
    setPrenom("");
    setPrenomTouched(false);
    setPrenomFocused(false);

    setEmail("");
    setEmailTouched(false);
    setEmailFocused(false);

    setPassword("");
    setPasswordTouched(false);
    setPasswordFocused(false);

    setAccepted(false);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSuccess(false);
    setEmailExists(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: prenom }),
      });
      const result = await res.json();

      if (res.ok && result?.success) {
        // Connexion immédiate
      const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) {
        setSubmitting(false);
        setError("Inscription ok mais connexion impossible : " + signErr.message);
        return;
      }

      // ✅ écrit les cookies httpOnly côté serveur
      await postAuthCallback(data.session, "1");

        // ✅ Écrit les cookies httpOnly côté serveur pour que le middleware voie la session
        try {
          await fetch("/auth/callback", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              event: "SIGNED_IN",
              session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
              },
              remember: "1", // "0" pour session éphémère si besoin
            }),
            keepalive: true,
          });
        } catch {
          /* noop */
        }

        // En dev / si pas d’envoi réel, on ouvre l’URL de prévisualisation
        if (result.previewUrl) {
          try {
            window.open(result.previewUrl as string, "_blank", "noopener,noreferrer");
          } catch {
            /* noop */
          }
        }

        // ✅ Normalisation pour satisfaire la signature attendue par nextStepPath
        const normalizedParams = new URLSearchParams(searchParams ? searchParams.toString() : "");

        // Étape suivante
        router.push(nextStepPath(pathname, normalizedParams));
        return;
      }

      const msg = String(result?.error ?? "");
      if (res.status === 409 || /exist|déjà|already|registered|existe déjà/i.test(msg)) {
        setEmailExists(true);
        setSubmitting(false);
        return;
      }

      setError(result?.error || "Une erreur est survenue.");
      setSubmitting(false);
    } catch {
      setError("Une erreur est survenue.");
      setSubmitting(false);
    }
  };

  const PasswordCriteriaItem = ({ valid, text }: { valid: boolean; text: string }) => {
    const iconSrc = valid ? "/icons/check-success.svg" : "/icons/check-neutral.svg";
    const textColor = valid ? "text-[#00D591]" : "text-[#C2BFC6]";
    return (
      <div className="flex justify-between items-center">
        <span className={textColor}>{text}</span>
        <img src={iconSrc} alt="État" className="w-[16px] h-[16px]" />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[10px]">
          Création de votre compte
        </h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center leading-snug">
          Créer un compte en moins d’une minute pour commencer
          <br className="hidden sm:block" />
          à utiliser la plateforme et l’app Glift.
        </p>

        <StepDots className="my-5" />

        {/* Bandeau ERREUR "email déjà existant" */}
        {emailExists && (
          <div className="w-[564px] mb-5" role="alert" aria-live="polite">
            <div className="relative px-5 py-2.5 bg-[#FFE3E3]">
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#EF4F4E] rounded-l-[5px]" />
              <p className="text-[#BA2524] text-[12px] font-bold mb-1">Attention</p>
              <p className="text-[#EF4F4E] text-[12px] font-semibold leading-relaxed">
                L&apos;adresse email que vous souhaitez utiliser est déjà liée à un compte existant.
                Connectez-vous à ce compte ou essayez un email différent.
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="w-full max-w-[368px] mb-4" role="status" aria-live="polite">
            <div className="relative rounded-[5px] px-5 py-4 bg-[#E3F9E5]">
              <span className="absolute left-0 top-0 h-full w-[6px] bg-[#57AE5B] rounded-l-[5px]" />
              <p className="text-[#245B2C] text-[15px] font-bold mb-1">
                Merci pour votre inscription&nbsp;!
              </p>
              <p className="text-[#245B2C] text-[14px] font-semibold leading-relaxed">
                Pour finaliser votre inscription, confirmez votre email en cliquant sur le lien reçu.
                Ce bandeau disparaîtra une fois votre compte validé.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
          {/* Prénom */}
          <div className="w-full max-w-[368px]">
            <label htmlFor="prenom" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
              Prénom
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              placeholder="John"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              onFocus={() => setPrenomFocused(true)}
              onBlur={() => {
                setPrenomTouched(true);
                setPrenomFocused(false);
              }}
              className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${
                shouldShowPrenomSuccess
                  ? "border border-[#00D591]"
                  : shouldShowPrenomError
                  ? "border border-[#EF4444]"
                  : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
              }`}
            />
            <div className="h-[20px] mt-[5px] text-[13px] font-medium">
              {shouldShowPrenomSuccess && <p className="text-[#00D591]">Enchanté {prenom.trim()} !</p>}
              {shouldShowPrenomError && (
                <p className="text-[#EF4444]">Le prénom ne doit contenir que des lettres</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="w-full max-w-[368px]">
            <label htmlFor="email" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => {
                setEmailTouched(true);
                setEmailFocused(false);
              }}
              className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${
                shouldShowEmailSuccess
                  ? "border border-[#00D591]"
                  : shouldShowEmailError
                  ? "border border-[#EF4444]"
                  : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
              }`}
            />
            <div className="h-[20px] mt-[5px] text-[13px] font-medium">
              {shouldShowEmailSuccess && (
                <p className="text-[#00D591]">Merci, cet email sera ton identifiant de connexion</p>
              )}
              {shouldShowEmailError && <p className="text-[#EF4444]">Format d’adresse invalide</p>}
            </div>
          </div>

          {/* Mot de passe */}
          <div className="w-full max-w-[368px] mb-[10px]">
            <label htmlFor="password" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => {
                  setPasswordTouched(true);
                  setTimeout(() => setPasswordFocused(false), 100);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).blur();
                  }
                }}
                className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${
                  shouldShowPasswordSuccess
                    ? "border border-[#00D591]"
                    : shouldShowPasswordError
                    ? "border border-[#EF4444]"
                    : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                }`}
              />
              <Tooltip
                content={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                offset={12}
                offsetX={1}
                delay={250}
              >
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <img
                    src={showPassword ? "/icons/masque_defaut.svg" : "/icons/visible_defaut.svg"}
                    alt=""
                    className="w-[25px] h-[25px]"
                  />
                  <span className="sr-only">
                    {showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  </span>
                </button>
              </Tooltip>
            </div>

            {passwordFocused && (
              <div
                className="mt-3 px-4 py-3 bg-white rounded-[8px] text-[12px] text-[#5D6494] space-y-2"
                style={{ boxShadow: "1px 1px 9px 1px rgba(0, 0, 0, 0.12)" }}
              >
                <PasswordCriteriaItem valid={hasMinLength} text="Au moins 8 caractères" />
                <PasswordCriteriaItem valid={hasLetter} text="Au moins 1 lettre" />
                <PasswordCriteriaItem valid={hasNumber} text="Au moins 1 chiffre" />
                <PasswordCriteriaItem valid={hasSymbol} text="Au moins 1 symbole" />
              </div>
            )}

            <div className="h-[20px] mt-[5px] text-[13px] font-medium">
              {shouldShowPasswordSuccess && <p className="text-[#00D591]">Mot de passe valide</p>}
              {shouldShowPasswordError && <p className="text-[#EF4444]">Mot de passe invalide</p>}
            </div>
          </div>

          {/* RGPD */}
          <div className="max-w-[368px] mb-[20px] w-full">
            <label
              htmlFor="rgpd"
              className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494]"
            >
              <div className="relative w-[15px] h-[15px] shrink-0 mt-[1px]">
                <input
                  id="rgpd"
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="peer sr-only"
                />
                <img
                  src="/icons/checkbox_unchecked.svg"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-[15px] h-[15px] peer-checked:hidden"
                />
                <img
                  src="/icons/checkbox_checked.svg"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-[15px] h-[15px] hidden peer-checked:block"
                />
              </div>

              <span className="mt-[-3px]">
                J’accepte la{" "}
                <Link href="#" className="text-[#7069FA] hover:text-[#6660E4]">
                  Politique de confidentialité
                </Link>{" "}
                et les{" "}
                <Link href="#" className="text-[#7069FA] hover:text-[#6660E4]">
                  Conditions générales d’utilisation
                </Link>{" "}
                de Glift.
              </span>
            </label>
          </div>

          {/* Erreur globale (autres cas) */}
          {error && <p className="text-[#EF4444] mb-4 text-sm text-center max-w-[368px]">{error}</p>}

          {/* CTA */}
          <div className="w-full flex justify-center mt-[10px]">
            <button
              type="submit"
              disabled={!isFormValid}
              aria-busy={submitting}
              className={`inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold
                ${!isFormValid ? "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed" : "bg-[#7069FA] text-white"}
                ${submitting ? "opacity-100 cursor-wait" : "hover:bg-[#6660E4]"}
              `}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="md" ariaLabel="Création du compte" />
                  En cours...
                </span>
              ) : (
                <>
                  <img
                    src="/icons/cadena_defaut.svg"
                    alt="Icône cadenas"
                    className={`w-[20px] h-[20px] mr-1 transition-colors ${isFormValid ? "invert brightness-0" : ""}`}
                  />
                  Créer mon compte
                </>
              )}
            </button>
          </div>

          <p className="mt-[20px] text-sm font-semibold text-[#5D6494] text-center">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-[#7069FA] hover:text-[#6660E4]">
              Connectez-vous
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
