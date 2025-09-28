"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";

import { createClientComponentClient } from "@/lib/supabase/client";
import {
  EXPERIENCE_OPTIONS,
  GENDER_OPTIONS,
  MAIN_GOALS,
} from "@/components/account/constants";

type PlanType = "starter" | "premium";

type AccountCreationStepProps = {
  plan: PlanType;
  onSuccess: () => void;
};

type PaymentStepProps = {
  onComplete: () => void;
};

type ProfileCompletionStepProps = {
  onSuccessDestination: string;
};

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => `${index + 1}`.padStart(2, "0"));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => `${index + 1}`.padStart(2, "0"));
const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEAR_OPTIONS = Array.from({ length: 100 }, (_, index) => `${CURRENT_YEAR - index}`);
const PAYMENT_YEAR_OPTIONS = Array.from({ length: 12 }, (_, index) => `${CURRENT_YEAR + index}`);

const StepIndicator = ({
  totalSteps,
  currentStep,
}: {
  totalSteps: number;
  currentStep: number;
}) => {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        return (
          <span
            key={step}
            aria-hidden
            className={clsx(
              "h-[9px] w-[9px] rounded-full transition-colors duration-200",
              isActive ? "bg-[#A1A5FD]" : "bg-[#ECE9F1]"
            )}
          />
        );
      })}
    </div>
  );
};

const AccountCreationStep = ({ plan, onSuccess }: AccountCreationStepProps) => {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [prenomTouched, setPrenomTouched] = useState(false);
  const [prenomFocused, setPrenomFocused] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isPrenomFormatValid = /^[a-zA-ZÀ-ÿ\s-]+$/.test(prenom.trim());
  const isPrenomFieldValid = prenom.trim().length > 0 && isPrenomFormatValid;
  const shouldShowPrenomSuccess = prenomTouched && !prenomFocused && isPrenomFieldValid;
  const shouldShowPrenomError = prenomTouched && !prenomFocused && prenom.trim() !== "" && !isPrenomFormatValid;

  const isEmailValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const shouldShowEmailSuccess = emailTouched && !emailFocused && isEmailValidFormat;
  const shouldShowEmailError = emailTouched && !emailFocused && email.trim() !== "" && !isEmailValidFormat;

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isPasswordValidFormat = hasMinLength && hasLetter && hasNumber && hasSymbol;
  const shouldShowPasswordSuccess = passwordTouched && !passwordFocused && isPasswordValidFormat;
  const shouldShowPasswordError = passwordTouched && !passwordFocused && password !== "" && !isPasswordValidFormat;

  const isFormValid = accepted && isPrenomFieldValid && isEmailValidFormat && isPasswordValidFormat && !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) return;

    setError("");
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
        setError(result.error || "Une erreur est survenue.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Connexion impossible après la création du compte.");
        return;
      }

      router.refresh();
      onSuccess();
    } catch (submitError) {
      console.error(submitError);
      setError("Une erreur réseau est survenue.");
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

  return (
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

      <div className="w-full">
        <label htmlFor="email" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="john.doe@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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

      <div className="w-full mb-[10px]">
        <label htmlFor="password" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => {
              setPasswordTouched(true);
              setTimeout(() => setPasswordFocused(false), 100);
            }}
            className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 ${
              shouldShowPasswordSuccess
                ? "border border-[#00D591]"
                : shouldShowPasswordError
                ? "border border-[#EF4444]"
                : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Image
              src={showPassword ? "/icons/masque_defaut.svg" : "/icons/visible_defaut.svg"}
              alt="Afficher/Masquer"
              width={25}
              height={25}
              className="w-[25px] h-[25px]"
            />
          </button>
        </div>
        {passwordFocused && (
          <div
            className="mt-3 px-4 py-3 bg-white rounded-[8px] text-[12px] text-[#5D6494] space-y-2"
            style={{
              boxShadow: "1px 1px 9px 1px rgba(0, 0, 0, 0.12)",
            }}
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

      <div className="mb-[20px] w-full">
        <label className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494]">
          <div className="relative w-[15px] h-[15px] shrink-0">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="peer appearance-none w-full h-full border rounded-[3px] transition-colors duration-150 border-[#D7D4DC] hover:border-[#C2BFC6] checked:border-[#7069FA] checked:bg-[#7069FA] cursor-pointer"
            />
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 left-1/2 w-[13px] h-[13px] -translate-x-1/2 -translate-y-1/2 fill-white hidden peer-checked:block"
            >
              <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.572 9.58-4.16-4.17a1 1 0 1 0-1.414 1.414l5.586 5.586a1 1 0 0 0 1.414 0l9.56-9.592z" />
            </svg>
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

      {error && <p className="text-[#EF4444] mb-4 text-sm text-center max-w-[368px]">{error}</p>}

      <div className="w-full flex justify-center mt-[10px]">
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full max-w-[220px] h-[44px] rounded-[25px] text-[16px] font-bold text-center transition flex items-center justify-center gap-2 ${
            isFormValid
              ? "bg-[#7069FA] text-white hover:bg-[#6660E4] cursor-pointer"
              : "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed"
          }`}
        >
          <Image
            src="/icons/cadena_defaut.svg"
            alt="Icône cadenas"
            width={20}
            height={20}
            className={`w-[20px] h-[20px] transition-colors ${isFormValid ? "invert brightness-0" : ""}`}
          />
          {loading ? "En cours..." : "Créer mon compte"}
        </button>
      </div>

      <p className="mt-[20px] text-sm font-semibold text-[#5D6494] text-center self-center">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="text-[#7069FA] hover:text-[#6660E4]">
          Connectez-vous
        </Link>
      </p>
    </form>
  );
};

const PaymentStep = ({ onComplete }: PaymentStepProps) => {
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const sanitizeCardNumber = (value: string) => value.replace(/[^0-9]/g, "");

  const formattedCardNumber = useMemo(() => {
    return cardNumber.replace(/(.{4})/g, "$1 ").trim();
  }, [cardNumber]);

  const handleCardNumberChange = (value: string) => {
    const sanitized = sanitizeCardNumber(value).slice(0, 19);
    setCardNumber(sanitized);
  };

  const handleCvcChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "").slice(0, 4);
    setCvc(sanitized);
  };

  const isCardNumberValid = sanitizeCardNumber(cardNumber).length >= 12;
  const isCvcValid = /^\d{3,4}$/.test(cvc);
  const isFormValid =
    cardHolder.trim().length > 0 &&
    isCardNumberValid &&
    expiryMonth !== "" &&
    expiryYear !== "" &&
    isCvcValid &&
    termsAccepted &&
    !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onComplete();
    }, 400);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[460px] rounded-[16px] bg-white px-6 py-8 shadow-[0_10px_40px_rgba(46,50,113,0.08)]"
    >
      <div className="rounded-[12px] bg-[#F6F5FF] px-4 py-3 text-sm font-semibold text-[#5D6494]">
        <p className="text-[#3A416F] text-[15px] font-bold mb-1">Paiement 100% sécurisé</p>
        <p>
          Pour activer votre essai gratuit, nous avons besoin de vos informations de paiement. Vous ne serez pas facturé avant le
          31/05/2025.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#3A416F]">Nom du titulaire de la carte</label>
          <input
            value={cardHolder}
            onChange={(event) => setCardHolder(event.target.value)}
            placeholder="John Doe"
            className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] px-4 text-[16px] font-semibold text-[#5D6494] placeholder-[#D7D4DC] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
          />
        </div>
        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#3A416F]">Numéro de carte</label>
          <input
            value={formattedCardNumber}
            onChange={(event) => handleCardNumberChange(event.target.value)}
            placeholder="1111 2222 3333 4444"
            inputMode="numeric"
            className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] px-4 text-[16px] font-semibold text-[#5D6494] placeholder-[#D7D4DC] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-[14px] font-semibold text-[#3A416F]">Date d’expiration</label>
            <div className="flex gap-2">
              <select
                value={expiryMonth}
                onChange={(event) => setExpiryMonth(event.target.value)}
                className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] bg-white px-3 text-[16px] font-semibold text-[#5D6494] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
              >
                <option value="">MM</option>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={expiryYear}
                onChange={(event) => setExpiryYear(event.target.value)}
                className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] bg-white px-3 text-[16px] font-semibold text-[#5D6494] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
              >
                <option value="">AAAA</option>
                {PAYMENT_YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[14px] font-semibold text-[#3A416F]">Code de sécurité</label>
            <input
              value={cvc}
              onChange={(event) => handleCvcChange(event.target.value)}
              placeholder="123"
              inputMode="numeric"
              className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] px-4 text-[16px] font-semibold text-[#5D6494] placeholder-[#D7D4DC] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
            />
          </div>
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 text-[13px] font-semibold text-[#5D6494]">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          className="mt-[3px] h-[16px] w-[16px] cursor-pointer rounded border border-[#D7D4DC] text-[#7069FA] focus:ring-[#7069FA]"
        />
        <span>
          Je confirme que je m’abonne à un service facturé 2,49 €/mois, renouvelé automatiquement à la fin de la période d’essai
          et annulable à tout moment. J’autorise le prélèvement automatique sur ma carte bancaire et reconnais avoir lu et accepté
          les conditions d’utilisation et la politique de confidentialité.
        </span>
      </label>

      <button
        type="submit"
        disabled={!isFormValid}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#7069FA] px-6 py-3 text-[16px] font-semibold text-white transition-colors ${
          isFormValid ? "hover:bg-[#6660E4]" : "opacity-50 cursor-not-allowed"
        }`}
      >
        <Image src="/icons/arrow.svg" alt="Icône flèche" width={20} height={20} />
        {loading ? "Traitement..." : "Démarrer mon abonnement"}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-[#5D6494]">
        <Image src="/icons/cadena_stripe.svg" alt="Cadenas" width={18} height={18} />
        <span>Paiement 100% sécurisé par</span>
        <Image src="/icons/logo_stripe.svg" alt="Stripe" width={48} height={18} />
      </div>
    </form>
  );
};

const ProfileCompletionStep = ({ onSuccessDestination }: ProfileCompletionStepProps) => {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [gender, setGender] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [experience, setExperience] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserMetadata = async () => {
      const { data } = await supabase.auth.getUser();
      const metadata = data?.user?.user_metadata as Record<string, unknown> | undefined;

      if (!metadata) return;

      if (typeof metadata.gender === "string") {
        setGender(metadata.gender);
      }

      if (typeof metadata.experience_years === "string") {
        setExperience(metadata.experience_years);
      }

      if (typeof metadata.main_goal === "string") {
        setMainGoal(metadata.main_goal);
      }

      if (typeof metadata.birth_date === "string" && metadata.birth_date.includes("-")) {
        const [year, month, day] = metadata.birth_date.split("-");
        setBirthYear(year || "");
        setBirthMonth(month || "");
        setBirthDay(day || "");
      }
    };

    void fetchUserMetadata();
  }, [supabase]);

  const isFormComplete =
    gender !== "" && birthDay !== "" && birthMonth !== "" && birthYear !== "" && experience !== "" && mainGoal !== "" && !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormComplete) return;

    setError(null);
    setLoading(true);

    const formattedBirthDate = `${birthYear}-${birthMonth}-${birthDay}`;

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          gender,
          birth_date: formattedBirthDate,
          experience_years: experience,
          main_goal: mainGoal,
        },
      });

      if (updateError) {
        setError(updateError.message || "Impossible d'enregistrer vos informations.");
        setLoading(false);
        return;
      }

      router.refresh();
      router.push(onSuccessDestination);
    } catch (submitError) {
      console.error(submitError);
      setError("Une erreur est survenue lors de l'enregistrement.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-6">
      <div className="w-full rounded-[16px] bg-white px-6 py-5 text-center shadow-[0_10px_40px_rgba(46,50,113,0.08)]">
        <p className="text-[15px] font-semibold text-[#3A416F]">
          Complétez votre profil et aidez-nous à mieux vous connaître en répondant aux 4 questions ci-dessous.
        </p>
      </div>

      {error && <p className="w-full text-center text-sm font-semibold text-[#EF4444]">{error}</p>}

      <div className="flex w-full flex-col gap-4">
        <div>
          <p className="mb-2 text-[14px] font-semibold text-[#3A416F]">Sexe</p>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((option) => {
              const isSelected = gender === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGender(isSelected ? "" : option)}
                  className={clsx(
                    "flex h-10 min-w-[110px] items-center justify-center rounded-full border px-4 text-[14px] font-semibold transition", 
                    isSelected ? "border-[#7069FA] bg-[#7069FA] text-white" : "border-[#D7D4DC] bg-white text-[#5D6494] hover:border-[#A1A5FD]"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[14px] font-semibold text-[#3A416F]">Date de naissance</p>
          <div className="flex gap-2">
            <select
              value={birthDay}
              onChange={(event) => setBirthDay(event.target.value)}
              className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] bg-white px-3 text-[16px] font-semibold text-[#5D6494] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
            >
              <option value="">Jour</option>
              {DAY_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(event) => setBirthMonth(event.target.value)}
              className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] bg-white px-3 text-[16px] font-semibold text-[#5D6494] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
            >
              <option value="">Mois</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value)}
              className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] bg-white px-3 text-[16px] font-semibold text-[#5D6494] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
            >
              <option value="">Année</option>
              {BIRTH_YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[14px] font-semibold text-[#3A416F]">Années de pratique</p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((option) => {
              const isSelected = experience === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setExperience(isSelected ? "" : option)}
                  className={clsx(
                    "flex h-10 min-w-[70px] items-center justify-center rounded-[10px] border px-3 text-[14px] font-semibold transition",
                    isSelected
                      ? "border-[#7069FA] bg-[#7069FA] text-white"
                      : "border-[#D7D4DC] bg-white text-[#5D6494] hover:border-[#A1A5FD]"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-semibold text-[#3A416F]" htmlFor="main-goal">
            Quel est votre objectif principal ?
          </label>
          <select
            id="main-goal"
            value={mainGoal}
            onChange={(event) => setMainGoal(event.target.value)}
            className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] bg-white px-3 text-[16px] font-semibold text-[#5D6494] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
          >
            <option value="">Sélectionnez un objectif</option>
            {MAIN_GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormComplete}
        className={`w-full rounded-full px-6 py-3 text-[16px] font-semibold transition ${
          isFormComplete
            ? "bg-[#7069FA] text-white hover:bg-[#6660E4]"
            : "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed"
        }`}
      >
        {loading ? "Enregistrement..." : "Enregistrer mes informations"}
      </button>

      <Link href="/entrainements" className="text-[14px] font-semibold text-[#7069FA] hover:text-[#6660E4]">
        Ignorer pour le moment
      </Link>
    </form>
  );
};

const InscriptionPage = () => {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  const plan = planParam === "premium" || planParam === "starter" ? (planParam as PlanType) : null;

  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    setCurrentStep(1);
  }, [plan]);

  const totalSteps = plan === "premium" ? 3 : 2;

  const stepDetails = useMemo(() => {
    if (plan === "premium") {
      return [
        {
          title: "Création de votre compte",
          subtitle: "Créez un compte en moins d’une minute pour commencer à utiliser la plateforme Glift.",
        },
        {
          title: "Mode de paiement",
          subtitle: "Activez votre essai gratuit en renseignant vos informations de paiement.",
        },
        {
          title: "Inscription terminée !",
          subtitle: "Complétez votre profil pour personnaliser vos entraînements.",
        },
      ];
    }

    if (plan === "starter") {
      return [
        {
          title: "Création de votre compte",
          subtitle: "Créez un compte en moins d’une minute pour commencer à utiliser la plateforme Glift.",
        },
        {
          title: "Inscription terminée !",
          subtitle: "Complétez votre profil pour personnaliser vos entraînements.",
        },
      ];
    }

    return [];
  }, [plan]);

  if (!plan) {
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

  const activeStep = stepDetails[currentStep - 1];

  let stepContent: ReactNode = null;

  if (currentStep === 1) {
    stepContent = (
      <AccountCreationStep
        plan={plan}
        onSuccess={() => setCurrentStep((previous) => Math.min(previous + 1, totalSteps))}
      />
    );
  } else if (plan === "starter") {
    stepContent = <ProfileCompletionStep onSuccessDestination="/compte#mes-informations" />;
  } else {
    if (currentStep === 2) {
      stepContent = <PaymentStep onComplete={() => setCurrentStep(3)} />;
    } else {
      stepContent = <ProfileCompletionStep onSuccessDestination="/compte#mes-informations" />;
    }
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[60px]">
      <div className="w-full max-w-3xl flex flex-col items-center">
        {activeStep && (
          <>
            <h1 className="text-center text-[26px] sm:text-[30px] font-bold text-[#2E3271]">{activeStep.title}</h1>
            <p className="mt-2 text-center text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug">
              {activeStep.subtitle}
            </p>
          </>
        )}
        <StepIndicator totalSteps={totalSteps} currentStep={currentStep} />

        <div className="mt-10 w-full flex justify-center">{stepContent}</div>
      </div>
    </main>
  );
};

export default InscriptionPage;
