"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import StepDots from "@/components/onboarding/StepDots";
import { nextStepPath } from "@/lib/onboarding";
import StripeWrapper from "@/components/stripe/StripeWrapper";

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

  const searchParamsString = searchParams?.toString() ?? "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const enforceSamePage = () => {
      window.history.pushState(null, "", window.location.href);
    };

    enforceSamePage();

    const handlePopState = () => {
      enforceSamePage();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, searchParamsString]);

  const trialEndParam = searchParams?.get("trialEnd") ?? null;

  const trialEndLabel = useMemo(() => {
    const explicit = trialEndParam;
    if (explicit) return explicit;

    const now = new Date();
    now.setDate(now.getDate() + 30);
    return formatFr(now);
  }, [trialEndParam]);

  const priceLabel = searchParams?.get("price") ?? "2,49 €/mois";

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
        <StripeWrapper priceLabel={priceLabel} />
      </div>
    </main>
  );
};

export default PaymentPage;
