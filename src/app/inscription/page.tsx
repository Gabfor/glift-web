"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function InscriptionPage() {
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  const shouldShowPasswordError =
  passwordTouched &&
  !passwordFocused &&
  password !== "" &&
  !isPasswordValidFormat;

  const isFormValid = accepted && isPrenomFieldValid && isEmailValidFormat && isPasswordValidFormat;
  
  const allCriteriaValid = hasMinLength && hasLetter && hasNumber && hasSymbol;
  
  const PasswordCriteriaItem = ({
    valid,
    touched,
    focused,
    text,
    passwordValue,
  }: {
    valid: boolean;
    touched: boolean;
    focused: boolean;
    text: string;
    passwordValue: string;
  }) => {
    const isEmpty = passwordValue.trim() === "";
  
    const showSuccess = !isEmpty && valid;
    const showError = !isEmpty && focused && !valid;
  
    const iconSrc = showSuccess
      ? "/icons/check-success.svg"
      : showError
      ? "/icons/error-password.svg"
      : "/icons/check-neutral.svg";
  
    const textColor = showSuccess
      ? "text-[#00D591]"
      : showError
      ? "text-[#EF4444]"
      : "text-[#C2BFC6]";
  
    return (
      <div className="flex justify-between items-center">
        <span className={textColor}>{text}</span>
        <img src={iconSrc} alt="État" className="w-[16px] h-[16px]" />
      </div>
    );
  };
  
  
  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[100px] pt-[140px] pb-[40px]">
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[10px]">
          Création de votre compte
        </h1>

        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center leading-snug mb-[40px]">
          Créer un compte en moins d’une minute pour commencer<br className="hidden sm:block" />
          à utiliser la plateforme et l’app Glift.
        </p>

        <form className="flex flex-col items-center w-full">
{/* Champ Prénom */}
<div className="w-full max-w-[368px]">
  <label htmlFor="prenom" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
    Prénom
  </label>

  <div className="relative">
    <input
      id="prenom"
      type="text"
      placeholder="John"
      value={prenom}
      onChange={(e) => setPrenom(e.target.value)}
      onFocus={() => setPrenomFocused(true)}
      onBlur={() => {
        setPrenomTouched(true);
        setPrenomFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur(); // déclenche la validation
        }
      }}
      className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150
        ${
          shouldShowPrenomSuccess
            ? "border border-[#00D591]"
            : shouldShowPrenomError
            ? "border border-[#EF4444]"
            : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
        }`}
    />

    {shouldShowPrenomSuccess && (
      <img src="/icons/check-success.svg" alt="OK" className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-all duration-200 ease-out" />
    )}
    {shouldShowPrenomError && (
      <img src="/icons/error.svg" alt="Erreur" className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-all duration-200 ease-out" />
    )}
  </div>

  <div className="h-[20px] mt-[5px] text-[13px] font-medium overflow-hidden">
    <p className={`transition-all duration-200 ease-out ${
      shouldShowPrenomSuccess
        ? "text-[#00D591] opacity-100 translate-y-0"
        : shouldShowPrenomError
        ? "text-[#EF4444] opacity-100 translate-y-0"
        : "opacity-0 -translate-y-1 pointer-events-none"
    }`}>
      {shouldShowPrenomSuccess
        ? `Enchanté ${prenom.trim()} !`
        : shouldShowPrenomError
        ? "Le prénom ne doit contenir que des lettres"
        : ""}
    </p>
  </div>
</div>
          {/* Champ Email */}
          <div className="w-full max-w-[368px]">
  <label htmlFor="email" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
    Adresse e-mail
  </label>

  <div className="relative">
    <input
      id="email"
      type="email"
      placeholder="john.doe@email.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onFocus={() => setEmailFocused(true)}
      onBlur={() => {
        setEmailTouched(true);
        setEmailFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur(); // déclenche la validation
        }
      }}
      className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150
        ${
          shouldShowEmailSuccess
            ? "border border-[#00D591]"
            : shouldShowEmailError
            ? "border border-[#EF4444]"
            : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
        }`}
    />

    {shouldShowEmailSuccess && (
      <img src="/icons/check-success.svg" alt="OK" className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-all duration-200 ease-out" />
    )}
    {shouldShowEmailError && (
      <img src="/icons/error.svg" alt="Erreur" className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-all duration-200 ease-out" />
    )}
  </div>

  <div className="h-[20px] mt-[5px] text-[13px] font-medium overflow-hidden">
    <p className={`transition-all duration-200 ease-out ${
      shouldShowEmailSuccess
        ? "text-[#00D591] opacity-100 translate-y-0"
        : shouldShowEmailError
        ? "text-[#EF4444] opacity-100 translate-y-0"
        : "opacity-0 -translate-y-1 pointer-events-none"
    }`}>
      {shouldShowEmailSuccess
        ? "Merci, cet email sera ton identifiant de connexion"
        : shouldShowEmailError
        ? "Format d’adresse invalide"
        : ""}
    </p>
  </div>
</div>
          {/* Champ Mot de passe */}
          <div className="w-full max-w-[368px]">
  <label htmlFor="password" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
    Mot de passe
  </label>

  <div className="relative">
  <input
    id="password"
    type={showPassword ? "text" : "password"}
    placeholder="Mot de passe"
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
        e.currentTarget.blur(); // déclenche la validation
      }
    }}
    className={`h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] pr-10 rounded-[5px] bg-white text-[#5D6494] transition-all duration-150
      ${
        shouldShowPasswordSuccess
          ? "border border-[#00D591]"
          : shouldShowPasswordError
          ? "border border-[#EF4444]"
          : "border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
      }`}
  />

  {/* Bouton œil : bien centré */}
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
  >
    <img
      src={showPassword ? "/icons/masque_defaut.svg" : "/icons/visible_defaut.svg"}
      alt={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      className="w-[25px] h-[25px]"
    />
  </button>
</div>

{/* Bloc de critères : en dehors du relative */}
{passwordFocused && (
  <div
    className="mt-3 px-4 py-3 bg-white rounded-[8px] text-[12px] text-[#5D6494] space-y-2 transition-all duration-200"
    style={{
      boxShadow: "1px 1px 9px 1px rgba(0, 0, 0, 0.12)",
    }}
  >
    <PasswordCriteriaItem
      valid={hasMinLength}
      touched={passwordTouched}
      focused={passwordFocused}
      passwordValue={password}
      text="Au moins 8 caractères"
    />
    <PasswordCriteriaItem
      valid={hasLetter}
      touched={passwordTouched}
      focused={passwordFocused}
      passwordValue={password}
      text="Au moins 1 lettre"
    />
    <PasswordCriteriaItem
      valid={hasNumber}
      touched={passwordTouched}
      focused={passwordFocused}
      passwordValue={password}
      text="Au moins 1 chiffre"
    />
    <PasswordCriteriaItem
      valid={hasSymbol}
      touched={passwordTouched}
      focused={passwordFocused}
      passwordValue={password}
      text="Au moins 1 symbole"
    />
  </div>
)}
<div className="h-[20px] mt-[5px] text-[13px] font-medium overflow-hidden">
  <p className={`transition-all duration-200 ease-out ${
    shouldShowPasswordSuccess
      ? "text-[#00D591] opacity-100 translate-y-0"
      : shouldShowPasswordError
      ? "text-[#EF4444] opacity-100 translate-y-0"
      : "opacity-0 -translate-y-1 pointer-events-none"
  }`}>
    {shouldShowPasswordSuccess
      ? "Mot de passe valide"
      : shouldShowPasswordError
      ? !hasMinLength
        ? "Le mot de passe doit contenir au moins 8 caractères"
        : !hasLetter
        ? "Le mot de passe doit contenir au moins 1 lettre"
        : !hasNumber
        ? "Le mot de passe doit contenir au moins 1 chiffre"
        : !hasSymbol
        ? "Le mot de passe doit contenir au moins 1 symbole"
        : "Mot de passe invalide."
      : ""}
  </p>
</div>
</div>
{/* Bloc RGPD */}
<div className="max-w-[368px] mt-[10px] w-full">
<label className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494]">
  {/* Zone checkbox personnalisée */}
  <div className="relative w-[15px] h-[15px] shrink-0">
  <input
  type="checkbox"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
  className="peer appearance-none w-full h-full border rounded-[3px] transition-colors duration-150
    border-[#D7D4DC]
    hover:border-[#C2BFC6]
    checked:border-[#7069FA]
    checked:hover:border-[#7069FA]
    checked:bg-[#7069FA]
    cursor-pointer"
/>

    {/* ✅ SVG affiché uniquement quand coché */}
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute top-1/2 left-1/2 w-[13px] h-[13px] -translate-x-1/2 -translate-y-1/2 fill-white hidden peer-checked:block"
    >
      <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.572 9.58-4.16-4.17a1 1 0 1 0-1.414 1.414l5.586 5.586a1 1 0 0 0 1.414 0l9.56-9.592z" />
    </svg>
  </div>

  {/* Texte RGPD avec alignement parfait */}
  <span className="mt-[-3px]">
    J’accepte la{" "}
    <Link href="#" className="text-[#7069FA] hover:text-[#6660E4]">Politique de confidentialité</Link> et les{" "}
    <Link href="#" className="text-[#7069FA] hover:text-[#6660E4]">Conditions générales d’utilisation</Link> de Glift.
  </span>
</label>

</div>

{/* Bouton Valider : à 20px du RGPD */}
<div className="mt-[20px] w-full flex justify-center">
<button
  type="submit"
  disabled={!isFormValid}
  className={`w-full max-w-[200px] h-[44px] rounded-[25px] text-[16px] font-bold text-center transition flex items-center justify-center gap-2
    ${
      isFormValid
        ? "bg-[#7069FA] text-white hover:bg-[#6660E4] cursor-pointer"
        : "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed"
    }`}
>
  <img
    src="/icons/cadena_defaut.svg"
    alt="Icône cadenas"
    className={`w-[20px] h-[20px] transition-colors ${
      isFormValid ? "invert brightness-0" : ""
    }`}
  />
  Créer mon compte
</button>
</div>

{/* Texte "Déjà inscrit ?" : à 20px du bouton */}
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
