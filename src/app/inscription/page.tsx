"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";

import CTAButton from "@/components/CTAButton";
import { EmailField, isValidEmail } from "@/components/forms/EmailField";
import { PasswordField, getPasswordValidationState } from "@/components/forms/PasswordField";
import { IconCheckbox } from "@/components/ui/IconCheckbox";
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

  const [accepted, setAccepted] = useState(false);
  type NormalizedError = {
    title: string;
    description?: string;
    emailFieldError?: string;
  };

  const [error, setError] = useState<NormalizedError | null>(null);
  const [loading, setLoading] = useState(false);

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

  const isFormValid = accepted && isPrenomFieldValid && isEmailValidFormat && isPasswordValidFormat && !loading;

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
            "Vous ne pouvez pas utiliser cet email car il est déjà associé à un compte actif sur la plateforme.",
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
            "Nous sommes désolés mais le code est invalide ou expiré. Merci de vérifier votre code ou de renvoyer un nouveau code.",
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

  const isOtpComplete = otpCode.every((digit) => digit !== "");

  const PasswordCriteriaItem = ({
    valid,
    text,
  }: {
    valid: boolean;
    text: string;
  }) => {
    const iconSrc = valid ? "/icons/check-success.svg" : "/icons/check-neutral.svg";
    const textColor = valid ? "text-[#00D591]" : "text-[#C2BFC6]";
    return (
      <div className="flex justify-between items-center">
        <span className={textColor}>{text}</span>
        <Image src={iconSrc} alt="État" width={16} height={16} className="w-[16px] h-[16px]" />
      </div>
    );
  };

  if (!plan || !stepMetadata) {
    return (
      <main className="min-h-screen bg-[#FBFCFE] flex flex-col items-center justify-center px-4">
        <div className="max-w-md rounded-[16px] bg-white px-6 py-8 text-center shadow-[0_10px_40px_rgba(46,50,113,0.08)]">
          <h1 className="text-[26px] font-bold text-[#2E3271]">Choisissez une formule</h1>
          <p className="mt-3 text-[15px] font-semibold text-[#5D6494]">
            Pour vous inscrire, sélectionnez d’abord une formule sur la page tarifs.
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
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px]">
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
          <div className="w-[564px] max-w-full mb-6 relative rounded-[5px] px-5 py-4 bg-[#FFF1F1]">
            <span className="absolute left-0 top-0 h-full w-[3px] bg-[#E34A4A] rounded-l-[5px]" />
            <p className="text-[14px] font-bold text-[#E34A4A] mb-2">{error.title}</p>
            {error.description && (
              <p className="text-[14px] font-semibold text-[#E34A4A] leading-snug">
                {error.description}
              </p>
            )}
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
            messageContainerClassName="h-[20px] mt-[5px] text-[13px] font-medium"
            criteriaRenderer={({ isFocused }) =>
              isFocused ? (
                <div
                  className="mt-3 px-4 py-3 bg-white rounded-[8px] text-[12px] text-[#5D6494] space-y-2"
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

          <div className="mb-[20px] w-full">
            <label className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494]">
              <IconCheckbox
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                size={15}
                containerClassName="mt-[3px]"
              />
              <span className="mt-[-3px]">
                J’accepte la{" "}
                <Link href="/politique-de-confidentialite" className="text-[#7069FA] hover:text-[#6660E4]" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité
                </Link>{" "}
                et les{" "}
                <Link href="/cgu" className="text-[#7069FA] hover:text-[#6660E4]" target="_blank" rel="noopener noreferrer">
                  Conditions générales d’utilisation
                </Link>{" "}
                de Glift.
              </span>
            </label>
          </div>
          <div className="w-full flex justify-center mt-[10px]">
            <CTAButton
              type="submit"
              className="w-full max-w-[220px] font-semibold"
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

          <p className="mt-[20px] text-sm font-semibold text-[#5D6494] text-center self-center">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-[#7069FA] hover:text-[#6660E4]">
              Connectez-vous
            </Link>
          </p>
        </form>

        {/* OTP Code Validation Modal matching Forgot Password flow */}
        <Modal
          open={showVerificationModal}
          title="Code de validation"
          onClose={() => setShowVerificationModal(false)}
          closeDisabled={otpLoading || isRedirecting}
          footer={
            <div className="flex justify-center gap-3">
              <CTAButton
                type="button"
                variant="secondary"
                onClick={() => setShowVerificationModal(false)}
                disabled={otpLoading || isRedirecting}
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
                className="px-[30px]"
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
                  title="Finalisez votre inscription"
                  description="Pour confirmer votre identité et finaliser la création de votre compte, saisissez le code que vous avez reçu dans votre email d'inscription."
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-1.5 w-full max-w-[338px]">
              <label className="text-[16px] font-bold text-[#3A416F] text-left w-full block">
                Code reçu par email
              </label>

              <div className="flex justify-start gap-2.5 w-full mt-1">
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
                    className={`w-[48px] h-[45px] rounded-[5px] border bg-white text-center text-[16px] font-semibold text-[#5D6494] placeholder-[#D7D4DC] transition-all duration-150 ${
                      otpError
                        ? "border-[#EF4444]"
                        : "border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
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
