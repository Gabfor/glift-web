"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";

import CTAButton from "@/components/CTAButton";
import { EmailField, isValidEmail } from "@/components/forms/EmailField";
import { PasswordField, getPasswordValidationState } from "@/components/forms/PasswordField";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useUser } from "@/context/UserContext";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";

import StepIndicator from "./components/StepIndicator";
import { getNextStepPath, getStepMetadata, parsePlan } from "./constants";

import { useSiteSettings } from "@/hooks/useSiteSettings";

const AccountCreationPage = () => {
  const { supabaseClient } = useSessionContext();
  const supabase = supabaseClient;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, isAuthenticated, isLoading, setOptimisticPremium } = useUser();
  const siteSettings = useSiteSettings();

  const planParam = searchParams?.get("plan") ?? null;
  const plan = parsePlan(planParam);
  const stepMetadata = getStepMetadata(plan, "account", siteSettings.isPremiumPaymentStepEnabled);

  type NormalizedError = {
    title: string;
    description?: string;
    emailFieldError?: string;
  };

  const [error, setError] = useState<NormalizedError | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(null);

  const [prenom, setPrenom] = useState("");
  const [prenomTouched, setPrenomTouched] = useState(false);
  const [prenomFocused, setPrenomFocused] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  // OTP Verification States
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<{ title: string; description: string } | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isPrenomFormatValid = /^[a-zA-ZÀ-ÿ\s-]+$/.test(prenom.trim());
  const isPrenomFieldValid = prenom.trim().length > 0 && isPrenomFormatValid;
  const shouldShowPrenomSuccess = prenomTouched && !prenomFocused && isPrenomFieldValid;
  const shouldShowPrenomError =
    prenomTouched && !prenomFocused && prenom.trim() !== "" && !isPrenomFormatValid;

  const isEmailValidFormat = isValidEmail(email);

  const passwordValidation = getPasswordValidationState(password);
  const { hasMinLength, hasLetter, hasNumber, hasSymbol, isValid: isPasswordValidFormat } = passwordValidation;

  const isFormValid = isPrenomFieldValid && isEmailValidFormat && isPasswordValidFormat && !loading;

  const searchParamsString = searchParams?.toString() ?? "";

  const nextStepPath = useMemo(() => {
    if (!plan) {
      return null;
    }

    const params = new URLSearchParams(searchParamsString);
    return getNextStepPath(plan, "account", params, siteSettings.isPremiumPaymentStepEnabled);
  }, [plan, searchParamsString, siteSettings.isPremiumPaymentStepEnabled]);



  useEffect(() => {
    if (isLoading || !isAuthenticated || !plan || !nextStepPath || showVerificationModal) {
      return;
    }

    router.replace(nextStepPath);
  }, [isAuthenticated, isLoading, nextStepPath, plan, router, showVerificationModal]);

  const handleEmailChange = (nextEmail: string) => {
    setEmail(nextEmail);
    setError((previous) => {
      if (previous?.emailFieldError) {
        return null;
      }

      return previous;
    });
  };

  const normalizeErrorMessage = (
    message: string | null | undefined,
  ): NormalizedError => {
    if (message) {
      const normalized = message.trim().toLowerCase();
      const normalizedWithoutDiacritics = normalized
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const emailAlreadyUsed =
        normalized.includes("already registered") ||
        normalized.includes("already in use") ||
        normalized.includes("already exists") ||
        normalized.includes("email registered") ||
        normalizedWithoutDiacritics.includes("deja utilise") ||
        normalizedWithoutDiacritics.includes("deja associe") ||
        normalizedWithoutDiacritics.includes("email deja");

      if (emailAlreadyUsed) {
        return {
          title: "Inscription impossible",
          description:
            "Tu ne peux pas utiliser cet email car il est déjà associé à un compte actif sur la plateforme.",
          emailFieldError: "Mince, cet email est déjà utilisé",
        };
      }

      return { title: message };
    }

    return {
      title: "Mince, il y a un problème...",
      description: "Nous sommes désolé mais nous rencontrons actuellement une erreur. Merci de réessayer dans un instant.",
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || !plan) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: prenom,
          plan,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(normalizeErrorMessage(result.error));
        return;
      }

      setOtpToken(result.token);
      setOtpCode(["", "", "", "", "", ""]);
      setOtpError(null);
      setOtpSuccessMessage(null);
      setShowVerificationModal(true);
      
      // Auto focus first input after modal opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);

    } catch (submitError) {
      console.error(submitError);
      setError(normalizeErrorMessage("Une erreur réseau est survenue."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const fullCode = otpCode.join("");
    if (fullCode.length !== 6 || !otpToken || !plan || !nextStepPath) return;

    setOtpError(null);
    setOtpSuccessMessage(null);
    setOtpLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fullCode,
          token: otpToken,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setOtpError({
          title: "Code invalide ou expiré",
          description:
            "Nous sommes désolés mais le code est invalide ou expiré. Merci de vérifier ton code ou de demander à recevoir un nouveau code.",
        });
        return;
      }

      const sessionPayload = result.session as
        | { access_token: string; refresh_token: string }
        | null
        | undefined;

      if (sessionPayload?.access_token && sessionPayload.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: sessionPayload.access_token,
          refresh_token: sessionPayload.refresh_token,
        });

        if (sessionError) {
          setOtpError({
            title: "Connexion impossible",
            description: sessionError.message || "Connexion impossible après la validation.",
          });
          return;
        }

        await refreshUser();
        if (plan === "premium") {
          setOptimisticPremium(true);
        }
        
        setIsRedirecting(true);
        router.replace(nextStepPath);
        return; // Exit here so we don't hit finally (wait, finally STILL runs in JS, so it's fine, we rely on isRedirecting)
      }

      // If we somehow reach here without success (e.g. sessionPayload missing but response.ok)
      setShowVerificationModal(false);
      router.replace(nextStepPath);
    } catch (err) {
      console.error(err);
      setOtpError({
        title: "Une erreur est survenue",
        description: "Une erreur réseau est survenue. Merci de réessayer ultérieurement.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCode = async () => {
    setOtpError(null);
    setOtpSuccessMessage(null);
    setOtpLoading(true);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: prenom,
          plan,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setOtpError({
          title: "Une erreur est survenue",
          description: result.error || "Impossible de renvoyer le code.",
        });
        return;
      }

      setOtpToken(result.token);
      setOtpCode(["", "", "", "", "", ""]);
      setOtpSuccessMessage("Un nouveau code a été envoyé par e-mail.");
      
      // Auto focus first input again
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);

    } catch (err) {
      console.error(err);
      setOtpError({
        title: "Une erreur est survenue",
        description: "Une erreur réseau est survenue.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (otpError) {
      setOtpError(null);
    }
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) {
      const newOtpCode = [...otpCode];
      newOtpCode[index] = "";
      setOtpCode(newOtpCode);
      return;
    }

    const newOtpCode = [...otpCode];
    newOtpCode[index] = cleanValue.slice(-1);
    setOtpCode(newOtpCode);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (otpError) {
      setOtpError(null);
    }
    if (e.key === "Backspace") {
      if (!otpCode[index] && index > 0) {
        const newOtpCode = [...otpCode];
        newOtpCode[index - 1] = "";
        setOtpCode(newOtpCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtpCode = [...otpCode];
        newOtpCode[index] = "";
        setOtpCode(newOtpCode);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (otpError) {
      setOtpError(null);
    }
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newOtpCode = [...otpCode];
      for (let i = 0; i < 6; i++) {
        newOtpCode[i] = pastedData[i] || "";
      }
      setOtpCode(newOtpCode);
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleOAuthSignUp = async (provider: "apple" | "google") => {
    try {
      setOauthLoading(provider);
      setError(null);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback${plan ? `?plan=${plan}` : ""}`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (authError) {
        setError({
          title: "Erreur d'inscription",
          description: authError.message || "Impossible de se connecter avec ce service.",
        });
        setOauthLoading(null);
      }
    } catch (err) {
      console.error("[oauth] error:", err);
      setError({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de l'authentification.",
      });
      setOauthLoading(null);
    }
  };

  const isOtpComplete = otpCode.every((digit) => digit !== "");

  const PasswordCriteriaItem = ({
    valid,
    text,
  }: {
    valid: boolean;
    text: string;
  }) => {
    const iconSrc = valid ? "/icons/check-success.svg" : "/icons/check-neutral.svg";
    const textColor = valid ? "text-[#00D591]" : "text-[#D7D4DC]";
    return (
      <div className="flex justify-between items-center font-semibold">
        <span className={textColor}>{text}</span>
        <Image src={iconSrc} alt="État" width={16} height={16} className="w-[16px] h-[16px]" />
      </div>
    );
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

  if (!plan || !stepMetadata) {
    return (
      <main className="min-h-screen bg-[#FBFCFE] flex flex-col items-center justify-center px-4">
        <div className="max-w-md rounded-[16px] bg-white px-6 py-8 text-center shadow-[0_10px_40px_rgba(46,50,113,0.08)]">
          <h1 className="text-[26px] font-bold text-[#2E3271]">Choisis une formule</h1>
          <p className="mt-3 text-[15px] font-semibold text-[#5D6494]">
            Pour t'inscrire, sélectionne d’abord une formule sur la page tarifs.
          </p>
          <Link
            href="/tarifs"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7069FA] px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-[#6660E4]"
          >
            Voir les tarifs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[100px] md:pt-[140px]">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-center text-[26px] sm:text-[30px] font-bold text-[#2E3271]">{stepMetadata.title}</h1>
        <p className="mt-2 text-center text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug whitespace-pre-line">
          {stepMetadata.subtitle}
        </p>

        <StepIndicator
          totalSteps={stepMetadata.totalSteps}
          currentStep={stepMetadata.currentStep}
          className={`mb-6 transition-opacity duration-200 ${siteSettings.isLoading ? "opacity-0" : "opacity-100"}`}
        />

        {error ? (
          <div className="w-[564px] max-w-full mb-6">
            <ErrorMessage
              title={error.title}
              description={error.description}
            />
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex w-full max-w-[368px] flex-col items-stretch">

          <div className="w-full">
            <label htmlFor="prenom" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
              Prénom
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              placeholder="John"
              value={prenom}
              onChange={(event) => setPrenom(event.target.value)}
              onFocus={() => setPrenomFocused(true)}
              onBlur={() => {
                setPrenomTouched(true);
                setPrenomFocused(false);
              }}
              className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${shouldShowPrenomSuccess
                ? "border border-[#00D591]"
                : shouldShowPrenomError
                  ? "border border-[#EF4444]"
                  : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                }`}
            />
            <div className="h-[20px] mt-[5px] text-[13px] font-medium">
              {shouldShowPrenomSuccess && <p className="text-[#00D591]">Enchanté {prenom.trim()} !</p>}
              {shouldShowPrenomError && <p className="text-[#EF4444]">Le prénom ne doit contenir que des lettres</p>}
            </div>
          </div>

          <EmailField
            id="email"
            label="Email"
            value={email}
            onChange={handleEmailChange}
            externalError={error?.emailFieldError ?? null}
            containerClassName="w-full"
            messageContainerClassName="h-[20px] mt-[5px] text-[13px] font-medium"
            successMessage="Merci, cet email sera ton identifiant de connexion"
            autoComplete="email"
          />

          <PasswordField
            id="password"
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            validate={(value) => getPasswordValidationState(value).isValid}
            successMessage="Mot de passe valide"
            errorMessage="Mot de passe invalide"
            containerClassName="w-full mb-[10px]"
            messageContainerClassName="h-[20px] mt-[5px] text-[13px] font-semibold"
            criteriaRenderer={({ isFocused }) =>
              isFocused ? (
                <div
                  className="mt-3 px-4 py-3 bg-white rounded-[8px] text-[12px] font-semibold text-[#5D6494] space-y-2"
                  style={{ boxShadow: "1px 1px 9px 1px rgba(0, 0, 0, 0.12)" }}
                >
                  <PasswordCriteriaItem valid={hasMinLength} text="Au moins 8 caractères" />
                  <PasswordCriteriaItem valid={hasLetter} text="Au moins 1 lettre" />
                  <PasswordCriteriaItem valid={hasNumber} text="Au moins 1 chiffre" />
                  <PasswordCriteriaItem valid={hasSymbol} text="Au moins 1 symbole" />
                </div>
              ) : null
            }
            blurDelay={100}
            autoComplete="new-password"
          />

          <div className="mb-[20px] w-full text-center">
            <p className="text-[14px] font-semibold text-[#5D6494]">
              En créant mon compte, j&apos;accepte la{" "}
              <Link href="/politique-de-confidentialite" className="text-[#7069FA] hover:text-[#6660E4]" target="_blank" rel="noopener noreferrer">
                Politique de confidentialité
              </Link>{" "}
              et les{" "}
              <Link href="/cgu" className="text-[#7069FA] hover:text-[#6660E4]" target="_blank" rel="noopener noreferrer">
                CGU
              </Link>{" "}
              de Glift.
            </p>
          </div>
          <div className="w-full flex justify-center mt-[10px]">
            <CTAButton
              type="submit"
              className="w-full md:w-auto font-semibold"
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
                  className={`h-[20px] w-[20px] transition-colors ${isFormValid ? "invert brightness-0" : ""
                    }`}
                />
                Créer mon compte
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
              onClick={() => {
                if (oauthLoading !== null || loading) return;
                handleOAuthSignUp("apple");
              }}
              className="w-full h-[44px] px-6 rounded-full bg-black text-white font-semibold text-[15px] flex items-center justify-center cursor-pointer select-none"
            >
              <div className="w-[20px] flex items-center justify-center shrink-0">
                <AppleIcon className="w-[17px] h-[20px] text-white" />
              </div>
              <div className="w-[185px] flex items-center justify-center text-center">
                <span className="whitespace-nowrap">S’inscrire avec Apple</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (oauthLoading !== null || loading) return;
                handleOAuthSignUp("google");
              }}
              className="w-full h-[44px] px-6 rounded-full border border-[#D7D4DC] bg-white text-[#000000] font-semibold text-[15px] flex items-center justify-center cursor-pointer select-none"
            >
              <div className="w-[20px] flex items-center justify-center shrink-0">
                <GoogleIcon className="w-[18px] h-[18px]" />
              </div>
              <div className="w-[185px] flex items-center justify-center text-center">
                <span className="whitespace-nowrap">S’inscrire avec Google</span>
              </div>
            </button>
          </div>

          <p className="pt-[30px] text-sm font-semibold text-[#5D6494] text-center self-center">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-[#7069FA] hover:text-[#6660E4]">
              Se connecter
            </Link>
          </p>
        </form>

        {/* OTP Code Validation Modal matching Forgot Password flow */}
        <Modal
          open={showVerificationModal}
          title={
            <div className="flex flex-col items-center">
              <div className="mb-3">
                <Image
                  src={otpError ? "/icons/cadena_rouge.svg" : "/icons/cadena_violet.svg"}
                  alt="Icône cadenas"
                  width={29}
                  height={35}
                  className="h-[35px] w-auto"
                />
              </div>
              <span>Code de validation</span>
            </div>
          }
          onClose={() => setShowVerificationModal(false)}
          closeDisabled={otpLoading || isRedirecting}
          footer={
            <div className="flex justify-center gap-3 w-full">
              <CTAButton
                type="button"
                variant="secondary"
                onClick={() => setShowVerificationModal(false)}
                disabled={otpLoading || isRedirecting}
                className="flex-1 w-full sm:w-auto sm:flex-initial"
              >
                Annuler
              </CTAButton>
              <CTAButton
                type="button"
                onClick={handleVerifyOTP}
                variant={isOtpComplete ? "active" : "inactive"}
                disabled={!isOtpComplete || isRedirecting}
                loading={otpLoading || isRedirecting}
                loadingText="En cours"
                keepWidthWhileLoading={false}
                className="flex-1 w-full sm:w-auto sm:flex-initial sm:px-[30px]"
              >
                Valider
              </CTAButton>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="w-full max-w-[504px] space-y-4">
              {otpError ? (
                <ModalMessage
                  variant="warning"
                  title={otpError.title}
                  description={otpError.description}
                />
              ) : otpSuccessMessage ? (
                <ModalMessage
                  variant="success"
                  title="Code renvoyé"
                  description={otpSuccessMessage}
                />
              ) : (
                <ModalMessage
                  variant="info"
                  title="Finalise ton inscription"
                  description="Pour finaliser la création de ton compte, saisis le code de validation à 6 chiffres que nous venons de t’envoyer par email."
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-1.5 w-full max-w-[338px]">
              <label className="text-[16px] font-bold text-[#3A416F] text-left w-full block">
                Code reçu par email
              </label>

              <div className="flex justify-between gap-1.5 sm:gap-2.5 w-full mt-1">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    placeholder="0"
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    className={`flex-1 min-w-0 max-w-[48px] h-[45px] rounded-[5px] border bg-white text-center text-[16px] font-semibold text-[#5D6494] placeholder-[#D7D4DC] transition-all duration-150 focus:outline-none focus:!border-transparent focus:ring-2 focus:ring-[#A1A5FD] ${
                      otpError ? "border-[#EF4444]" : "border-[#D7D4DC] hover:border-[#C2BFC6]"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={otpLoading}
                className="text-[13px] font-semibold text-[#7069FA] hover:text-[#6660E4] transition-colors mt-3 disabled:opacity-50"
              >
                Renvoyer le code
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </main>
  );
};

export default AccountCreationPage;
