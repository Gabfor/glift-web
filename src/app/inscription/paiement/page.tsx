"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import StepDots from "@/components/onboarding/StepDots";
import { nextStepPath } from "@/lib/onboarding";

import { getStepMetadata, parsePlan } from "../constants";

function formatFr(date: Date) {
  return date.toLocaleDateString("fr-FR");
}

const PaymentPage = () => {
  const router = useRouter();
  const pathname = usePathname() ?? "/inscription/paiement";
  const searchParams = useSearchParams();

  const planParam = searchParams?.get("plan") ?? null;
  const plan = parsePlan(planParam);
  const stepMetadata = plan ? getStepMetadata(plan, "payment") : null;

  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const trialEndParam = searchParams?.get("trialEnd") ?? null;

  const trialEndLabel = useMemo(() => {
    const explicit = trialEndParam;
    if (explicit) return explicit;

    const now = new Date();
    now.setDate(now.getDate() + 30);
    return formatFr(now);
  }, [trialEndParam]);

  const priceLabel = searchParams?.get("price") ?? "2,49 €/mois";

  const handleContinue = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      const destination = nextStepPath(pathname, params);
      router.push(destination);
    } finally {
      setLoading(false);
    }
  };

  const btnDisabled = !accepted || loading;
  const arrowIcon = btnDisabled ? "/icons/arrow_grey.svg" : "/icons/arrow.svg";

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
    <main className="min-h-screen bg-[#FBFCFE] flex flex-col items-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[10px]">
          Mode de paiement
        </h1>
      </div>
      <div className="w-full max-w-2xl flex flex-col items-center px-4 sm:px-0">
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center leading-snug">
          Pour activer votre essai gratuit, nous avons besoin de vos informations de paiement. Vous ne serez pas facturé avant le{" "}
          <span className="font-bold text-[#5D6494]">{trialEndLabel}</span>.
        </p>
        <StepDots
          className="my-5"
          totalSteps={stepMetadata.totalSteps}
          currentStep={stepMetadata.currentStep}
        />
      </div>

      <div className="w-full max-w-[564px] mt-2">
        <div className="relative rounded-[5px] px-5 py-2.5 bg-[#F5F4FF]">
          <span className="absolute left-0 top-0 h-full w-[3px] bg-[#A1A5FD] rounded-l-[5px]" />
          <p className="text-[12px] font-bold text-[#7069FA] mb-1">Paiement 100% sécurisé</p>
          <p className="text-[12px] font-semibold text-[#A1A5FD] leading-relaxed">
            Nous utilisons Stripe comme plateforme de paiement. Stripe respecte les critères de sécurité les plus stricts en vigueur dans l’industrie.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[564px] mt-8">
        <div className="rounded-[12px] bg-white p-6 shadow-sm border border-[#ECE9F1] mb-6">
          <p className="text-[#5D6494]">[Stripe Payment Element à intégrer]</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494] mb-5">
          <div className="relative w-[15px] h-[15px] shrink-0 mt-[4px]">
            <input
              id="subscription"
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
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
          <span className="leading-relaxed">
            Je comprends que je m’abonne à un service facturé{" "}
            <span className="font-bold">{priceLabel}</span>, renouvelé automatiquement à la fin de la période d’essai et annulable à tout moment. J’autorise le prélèvement automatique sur ma carte. Je demande l’accès immédiat au service et je reconnais que je renonce à mon droit de rétractation.
          </span>
        </label>

        <div className="mt-0 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            disabled={btnDisabled}
            aria-disabled={btnDisabled}
            className={`inline-flex items-center justify-center h-[48px] rounded-[25px] px-[15px] text-[16px] font-semibold ${
              btnDisabled
                ? "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed"
                : "bg-[#7069FA] text-white hover:bg-[#6660E4]"
            }`}
          >
            {loading ? (
              "Validation…"
            ) : (
              <>
                Démarrer mon abonnement
                <img src={arrowIcon} alt="" aria-hidden="true" className="w-[25px] h-[25px] ml-1" />
              </>
            )}
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-semibold text-[#5D6494]">
          <img src="/icons/cadena_stripe.svg" alt="Sécurisé" className="h-[16px] w-auto mt-[-3px]" />
          <span>Paiement 100% sécurisé par</span>
          <img src="/icons/logo_stripe.svg" alt="Stripe" className="h-[16px] w-auto ml-[-3px]" />
        </div>
      </div>
    </main>
  );
};

export default PaymentPage;
