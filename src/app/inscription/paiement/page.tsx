"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import StepDots from "@/components/onboarding/StepDots";
import { nextStepPath } from "@/lib/onboarding";

function formatFr(d: Date) {
  return d.toLocaleDateString("fr-FR");
}

export default function PaiementPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/inscription/paiement";
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Date affichée en gras dans le sous-titre (trialEnd=DD/MM/YYYY sinon J+14)
  const trialEndLabel = useMemo(() => {
    const q = searchParams?.get("trialEnd");
    if (q) return q;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return formatFr(d);
  }, [searchParams]);

  // Prix (optionnel via ?price=2,49 €/mois), sinon valeur par défaut
  const priceLabel = searchParams?.get("price") ?? "2,49 €/mois";

  const handleContinue = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      // TODO: intégrer Stripe (Payment Element/Checkout + confirmation)
      const to = nextStepPath(
        pathname,
        new URLSearchParams(searchParams?.toString() ?? "")
      );
      router.push(to);
    } finally {
      setLoading(false);
    }
  };

  // -- état du bouton + icône flèche
  const btnDisabled = !accepted || loading;
  const arrowIcon = btnDisabled ? "/icons/arrow_grey.svg" : "/icons/arrow.svg";

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex flex-col items-center px-4 pt-[140px] pb-[40px]">
      {/* Header identique à Inscription */}
      <div className="w-full max-w-md flex flex-col items-center px-4 sm:px-0">
        <h1 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[10px]">
          Mode de paiement
        </h1>
      </div>
      <div className="w-full max-w-2xl flex flex-col items-center px-4 sm:px-0">
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center leading-snug">
          Pour activer votre essai gratuit, nous avons besoin de vos informations de paiement.
          Vous ne serez pas facturé avant le{" "}
          <span className="font-bold text-[#5D6494]">{trialEndLabel}</span>.
        </p>
        <StepDots className="my-5" />
      </div>

      {/* Encart “Paiement 100% sécurisé” (≤ 564px) */}
      <div className="w-full max-w-[564px] mt-2">
        <div className="relative rounded-[5px] px-5 py-2.5 bg-[#F5F4FF]">
          <span className="absolute left-0 top-0 h-full w-[3px] bg-[#A1A5FD] rounded-l-[5px]" />
          <p className="text-[12px] font-bold text-[#7069FA] mb-1">
            Paiement 100% sécurisé
          </p>
          <p className="text-[12px] font-semibold text-[#A1A5FD] leading-relaxed">
            Nous utilisons Stripe comme plateforme de paiement. Stripe respecte les critères de
            sécurité les plus stricts en vigueur dans l’industrie.
          </p>
        </div>
      </div>

      {/* Zone de paiement + conditions + CTA (≤ 564px) */}
      <div className="w-full max-w-[564px] mt-8">
        {/* TODO: Stripe Payment Element ici */}
        <div className="rounded-[12px] bg-white p-6 shadow-sm border border-[#ECE9F1] mb-6">
          <p className="text-[#5D6494]">[Stripe Payment Element à intégrer]</p>
        </div>

        {/* Conditions d’abonnement */}
        <label className="flex items-start gap-3 cursor-pointer select-none text-[14px] font-semibold text-[#5D6494] mb-5">
          <div className="relative w-[15px] h-[15px] shrink-0 mt-[4px]">
            <input
              id="subscription"
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="peer sr-only"
            />
            {/* non coché → icône 'unchecked' */}
            <img
              src="/icons/checkbox_unchecked.svg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-[15px] h-[15px] peer-checked:hidden"
            />
            {/* coché → icône 'checked' */}
            <img
              src="/icons/checkbox_checked.svg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-[15px] h-[15px] hidden peer-checked:block"
            />
          </div>
          <span className="leading-relaxed">
            Je comprends que je m’abonne à un service facturé{" "}
            <span className="font-bold">{priceLabel}</span>, renouvelé automatiquement à la fin de
            la période d’essai et annulable à tout moment. J’autorise le prélèvement automatique
            sur ma carte. Je demande l’accès immédiat au service et je reconnais que je renonce
            à mon droit de rétractation.
          </span>
        </label>

        {/* CTA (largeur = texte + 15px de chaque côté) */}
        <div className="mt-0 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            disabled={btnDisabled}
            aria-disabled={btnDisabled}
            className={`inline-flex items-center justify-center h-[48px] rounded-[25px] px-[15px] text-[16px] font-bold
              ${btnDisabled
                ? "bg-[#ECE9F1] text-[#D7D4DC] cursor-not-allowed"
                : "bg-[#7069FA] text-white hover:bg-[#6660E4]"}
            `}
          >
            {loading ? (
              "Validation…"
            ) : (
              <>
                Démarrer mon abonnement
                <img
                  src={arrowIcon}
                  alt=""
                  aria-hidden="true"
                  className="w-[25px] h-[25px] ml-1"
                />
              </>
            )}
          </button>
        </div>

        {/* Liseré “Paiement 100% sécurisé par Stripe” */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-semibold text-[#5D6494]">
          <img
            src="/icons/cadena_stripe.svg"
            alt="Sécurisé"
            className="h-[16px] w-auto mt-[-3px]"
          />
          <span>Paiement 100% sécurisé par</span>
          <img
            src="/icons/logo_stripe.svg"
            alt="Stripe"
            className="h-[16px] w-auto ml-[-3px]"
          />
        </div>
      </div>
    </main>
  );
}
