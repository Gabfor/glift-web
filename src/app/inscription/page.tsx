"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InscriptionPage() {
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [prenom, setPrenom] = useState("");
  const [prenomTouched, setPrenomTouched] = useState(false);
  const [prenomFocused, setPrenomFocused] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();

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

  const isFormValid = accepted && isPrenomFieldValid && isEmailValidFormat && isPasswordValidFormat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: prenom }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        router.push("/entrainements");
        router.refresh(); // 👈 ajoute ceci après la redirection
      } else {
        setError(result.error || "Une erreur est survenue.");
      }
    } catch (error: unknown) {
      console.error(error);
      setError("Une erreur réseau est survenue.");
    }
  };

  const PasswordCriteriaItem = ({
    valid,
    text,
  }: {
    valid: boolean;
    text: string;
  }) => {
    const iconSrc = valid
      ? "/icons/check-success.svg"
      : "/icons/check-neutral.svg";
    const textColor = valid ? "text-[#00D591]" : "text-[#C2BFC6]";
    return (
      <div className="flex justify-between items-center">
        <span className={textColor}>{text}</span>
        <Image src={iconSrc} alt="État" width={16} height={16} className="w-[16px] h-[16px]" />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[10px]">
          Création de votre compte
        </h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center leading-snug mb-[40px]">
          Créer un compte en moins d’une minute pour commencer
          <br className="hidden sm:block" />
          à utiliser la plateforme et l’app Glift.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
          {/* Champ Prénom */}
          <div className="w-full max-w-[368px]">
            <label htmlFor="prenom" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Prénom</label>
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
              {shouldShowPrenomError && <p className="text-[#EF4444]">Le prénom ne doit contenir que des lettres</p>}
            </div>
          </div>

          {/* Champ Email */}
          <div className="w-full max-w-[368px]">
            <label htmlFor="email" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Adresse e-mail</label>
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

          {/* Champ Mot de passe */}
          <div className="w-full max-w-[368px] mb-[10px]">
            <label htmlFor="password" className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => {
                  setPasswordTouched(true);
                  setTimeout(() => setPasswordFocused(false), 100); // ⏱ éviter la fermeture instantanée du bloc
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

          {/* RGPD */}
          <div className="max-w-[368px] mb-[20px] w-full">
            <label className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494]">
              <div className="relative w-[15px] h-[15px] shrink-0">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="peer appearance-none w-full h-full border rounded-[3px] transition-colors duration-150
                    border-[#D7D4DC] hover:border-[#C2BFC6]
                    checked:border-[#7069FA] checked:bg-[#7069FA] cursor-pointer"
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

          {/* Erreur globale */}
          {error && (
            <p className="text-[#EF4444] mb-4 text-sm text-center max-w-[368px]">{error}</p>
          )}

          {/* Bouton inscription */}
          <div className="w-full flex justify-center mt-[10px]">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full max-w-[200px] h-[44px] rounded-[25px] text-[16px] font-bold text-center transition flex items-center justify-center gap-2 ${
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
              Créer mon compte
            </button>
          </div>

          {/* Lien vers Connexion */}
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
