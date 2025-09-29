"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { IconCheckbox } from "@/components/ui/IconCheckbox";

import StepIndicator from "../components/StepIndicator";
import { getNextStepPath, getStepMetadata, parsePlan } from "../constants";

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = parsePlan(searchParams.get("plan"));
  const stepMetadata = getStepMetadata(plan, "payment");

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

  const searchParamsString = searchParams.toString();

  const nextStepPath = useMemo(() => {
    if (!plan) {
      return null;
    }

    const params = new URLSearchParams(searchParamsString);
    return getNextStepPath(plan, "payment", params);
  }, [plan, searchParamsString]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || !stepMetadata || !nextStepPath) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push(nextStepPath);
    }, 400);
  };

  if (!plan || plan !== "premium" || !stepMetadata) {
    return (
      <main className="min-h-screen bg-[#FBFCFE] flex flex-col items-center justify-center px-4">
        <div className="max-w-md rounded-[16px] bg-white px-6 py-8 text-center shadow-[0_10px_40px_rgba(46,50,113,0.08)]">
          <h1 className="text-[26px] font-bold text-[#2E3271]">Redirection nécessaire</h1>
          <p className="mt-3 text-[15px] font-semibold text-[#5D6494]">
            Cette étape est réservée à la formule Premium. Reprenez le tunnel d’inscription depuis la première étape.
          </p>
          <Link
            href="/inscription"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7069FA] px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-[#6660E4]"
          >
            Retour à l’inscription
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

        <form
          onSubmit={handleSubmit}
          className="mt-10 mx-auto w-full max-w-[460px] rounded-[16px] bg-white px-6 py-8 shadow-[0_10px_40px_rgba(46,50,113,0.08)]"
        >
          <div className="rounded-[12px] bg-[#F6F5FF] px-4 py-3 text-sm font-semibold text-[#5D6494]">
            <p className="text-[#3A416F] text-[15px] font-bold mb-1">Paiement 100% sécurisé</p>
            <p>
              Pour activer votre essai gratuit, nous avons besoin de vos informations de paiement. Vous ne serez pas facturé avant le 31/05/2025.
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
                    {Array.from({ length: 12 }).map((_, index) => {
                      const month = `${index + 1}`.padStart(2, "0");
                      return (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={expiryYear}
                    onChange={(event) => setExpiryYear(event.target.value)}
                    className="h-[45px] w-full rounded-[8px] border border-[#D7D4DC] bg-white px-3 text-[16px] font-semibold text-[#5D6494] focus:border-[#A1A5FD] focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
                  >
                    <option value="">AAAA</option>
                    {Array.from({ length: 12 }).map((_, index) => {
                      const year = `${new Date().getFullYear() + index}`;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
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

          <label className="mt-6 flex items-start gap-3 text-[13px] font-semibold text-[#5D6494] cursor-pointer">
            <IconCheckbox
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              size={16}
              containerClassName="mt-[3px]"
            />
            <span>
              Je confirme que je m’abonne à un service facturé 2,49 €/mois, renouvelé automatiquement à la fin de la période d’essai et annulable à tout moment. J’autorise le prélèvement automatique sur ma carte bancaire et reconnais avoir lu et accepté les conditions d’utilisation et la politique de confidentialité.
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
      </div>
    </main>
  );
};

export default PaymentPage;
