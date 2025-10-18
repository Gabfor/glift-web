"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CTAButton from "@/components/CTAButton";
import { EmailField, isValidEmail } from "@/components/forms/EmailField";
import { PasswordField, getPasswordValidationState } from "@/components/forms/PasswordField";
import { IconCheckbox } from "@/components/ui/IconCheckbox";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useUser } from "@/context/UserContext";
import ErrorMessage from "@/components/ui/ErrorMessage";

import StepIndicator from "./components/StepIndicator";
import { getNextStepPath, getStepMetadata, parsePlan } from "./constants";

const AccountCreationPage = () => {
  const { supabaseClient } = useSessionContext();
  const supabase = supabaseClient;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useUser();

  const planParam = searchParams?.get("plan") ?? null;
  const plan = parsePlan(planParam);
  const stepMetadata = getStepMetadata(plan, "account");

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
  const [emailFieldState, setEmailFieldState] = useState<"idle" | "success" | "error">("idle");

  const [password, setPassword] = useState("");

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
    return getNextStepPath(plan, "account", params);
  }, [plan, searchParamsString]);

  const hasEmailFieldError = Boolean(error?.emailFieldError);

  useEffect(() => {
    if (!hasEmailFieldError) {
      return;
    }

    const trimmedEmail = email.trim();

    if (
      emailFieldState === "success" ||
      (emailFieldState === "idle" && trimmedEmail === "")
    ) {
      setError((currentError) => {
        if (!currentError?.emailFieldError) {
          return currentError;
        }

        return { ...currentError, emailFieldError: undefined };
      });
    }
  }, [emailFieldState, hasEmailFieldError, email]);

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
      title: "Une erreur est survenue.",
      description: "Nous n'avons pas pu finaliser votre inscription. Merci de réessayer.",
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || !plan || !nextStepPath) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
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
          setError(
            normalizeErrorMessage(
              sessionError.message ||
                "Connexion impossible après la création du compte.",
            ),
          );
          return;
        }

        await refreshUser();
      } else {
        try {
          const response = await fetch("/api/auth/provisional-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const provisionalResult: {
            success?: boolean;
            session?: { access_token: string; refresh_token: string } | null;
            error?: string;
          } = await response.json();

          if (response.ok && provisionalResult.success && provisionalResult.session) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: provisionalResult.session.access_token,
              refresh_token: provisionalResult.session.refresh_token,
            });

            if (sessionError) {
              setError(
                normalizeErrorMessage(
                  sessionError.message ||
                    "Connexion impossible après la création du compte.",
                ),
              );
              return;
            }

            await refreshUser();
          } else if (!response.ok) {
            setError(
              normalizeErrorMessage(
                provisionalResult.error ||
                  "Nous n'avons pas pu finaliser votre inscription. Merci de vérifier votre email.",
              ),
            );
            return;
          }
        } catch (provisionalError) {
          console.error(
            "Impossible de récupérer une session provisoire après inscription",
            provisionalError,
          );
        }
      }

      router.refresh();
      router.push(nextStepPath);
    } catch (submitError) {
      console.error(submitError);
      setError(normalizeErrorMessage("Une erreur réseau est survenue."));
    } finally {
      setLoading(false);
    }
  };

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
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[60px]">
      <div className="w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-center text-[26px] sm:text-[30px] font-bold text-[#2E3271]">{stepMetadata.title}</h1>
        <p className="mt-2 text-center text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug">
          {stepMetadata.subtitle}
        </p>

        <StepIndicator
          totalSteps={stepMetadata.totalSteps}
          currentStep={stepMetadata.currentStep}
          className="mb-6"
        />

        {error ? (
          <div className="w-[564px] max-w-full mb-6">
            <ErrorMessage title={error.title} description={error.description} className="w-full" />
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
              {shouldShowPrenomError && <p className="text-[#EF4444]">Le prénom ne doit contenir que des lettres</p>}
            </div>
          </div>

          <EmailField
            id="email"
            label="Email"
            value={email}
            onChange={setEmail}
            externalError={error?.emailFieldError ?? null}
            onStateChange={setEmailFieldState}
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
                  className={`h-[20px] w-[20px] transition-colors ${
                    isFormValid ? "invert brightness-0" : ""
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
      </div>
    </main>
  );
};

export default AccountCreationPage;
