"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { IconCheckbox } from "@/components/ui/IconCheckbox";
import { createClientComponentClient } from "@/lib/supabase/client";

import StepIndicator from "./components/StepIndicator";
import { getNextStepPath, getStepMetadata, parsePlan } from "./constants";

const AccountCreationPage = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = parsePlan(searchParams.get("plan"));
  const stepMetadata = getStepMetadata(plan, "account");

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
  const shouldShowPrenomError =
    prenomTouched && !prenomFocused && prenom.trim() !== "" && !isPrenomFormatValid;

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

  const searchParamsString = searchParams.toString();

  const nextStepPath = useMemo(() => {
    if (!plan) {
      return null;
    }

    const params = new URLSearchParams(searchParamsString);
    return getNextStepPath(plan, "account", params);
  }, [plan, searchParamsString]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || !plan || !nextStepPath) return;

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
      router.push(nextStepPath);
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

        <StepIndicator totalSteps={stepMetadata.totalSteps} currentStep={stepMetadata.currentStep} />

        <form onSubmit={handleSubmit} className="mt-10 flex w-full max-w-[368px] flex-col items-stretch">
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
      </div>
    </main>
  );
};

export default AccountCreationPage;
