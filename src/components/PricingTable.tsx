"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CTAButton from "@/components/CTAButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useSiteSettings, SiteSettings } from "@/hooks/useSiteSettings";
import { Subscription } from "@/app/admin/create-blog-article/blogArticleForm";
import { replaceSettingsVariables } from "@/lib/utils/settingsVariables";

type PricingTableProps = {
  abonnement1?: Subscription;
  abonnement2?: Subscription;
  initialSettings?: Partial<SiteSettings>;
};

export default function PricingTable({ abonnement1, abonnement2, initialSettings }: PricingTableProps) {
  const {
    trialDays,
    starterMaxTrainings,
    starterMaxExercises,
    premiumMonthlyEnabled,
    premiumYearlyEnabled,
    premiumMonthlyPrice,
    premiumYearlyPrice,
  } = useSiteSettings(initialSettings);

  const showToggle = premiumMonthlyEnabled && premiumYearlyEnabled;

  const [interval, setInterval] = useState<"monthly" | "yearly">(() => {
    if (!premiumMonthlyEnabled && premiumYearlyEnabled) return "yearly";
    return "monthly";
  });

  // Synchroniser avec les réglages dès qu'ils sont disponibles
  useEffect(() => {
    if (!premiumMonthlyEnabled && premiumYearlyEnabled) {
      setInterval("yearly");
    } else if (premiumMonthlyEnabled && !premiumYearlyEnabled) {
      setInterval("monthly");
    }
  }, [premiumMonthlyEnabled, premiumYearlyEnabled]);

  // Calcul du pourcentage d'économie
  const parsePrice = (priceStr?: string) => {
    if (!priceStr) return 0;
    const clean = priceStr.replace(",", ".").replace(/[^0-9.]/g, "");
    return parseFloat(clean) || 0;
  };

  const monthlyVal = parsePrice(premiumMonthlyPrice);
  const yearlyVal = parsePrice(premiumYearlyPrice);
  const discountPercent =
    monthlyVal > 0 && yearlyVal > 0 && 12 * monthlyVal > yearlyVal
      ? Math.round(((12 * monthlyVal - yearlyVal) / (12 * monthlyVal)) * 100)
      : 0;

  const renderAbo = (abo: Subscription, isPremium?: boolean) => {
    const varContext = {
      starterMaxTrainings,
      starterMaxExercises,
      premiumMonthlyPrice,
      premiumYearlyPrice,
      trialDays,
      interval,
    };

    let priceDisplay = isPremium
      ? (interval === "yearly" ? (premiumYearlyPrice || abo.prix) : (premiumMonthlyPrice || abo.prix))
      : (abo.prix || "0,00");
    priceDisplay = replaceSettingsVariables(priceDisplay, varContext);

    const isFree = (
      priceDisplay === "0,00" ||
      priceDisplay === "0.00" ||
      priceDisplay === "0" ||
      priceDisplay.trim().toLowerCase() === "gratuit"
    );

    const periodDisplay = isPremium
      ? (interval === "yearly" ? "/an" : "/mois")
      : "/mois";

    const formattedNom = replaceSettingsVariables(abo.nom, varContext);
    const formattedBadge = replaceSettingsVariables(abo.badge, varContext);
    const formattedDescription = replaceSettingsVariables(
      abo.description
        ?.replace(
          /Un abonnement pour ceux qui suivent toujours le m[êe]me entra[îi]nement\.?/gi,
          "Idéal si tu te concentres sur un programme unique et ciblé."
        )
        ?.replace(
          /Un abonnement pour ceux qui suivent plusieurs entra[îi]nements\.?/gi,
          "Idéal si tu veux varier tes entraînements, alterner tes cycles et progresser sans limites"
        ) || abo.description,
      varContext
    );
    const formattedBoutonTexte = replaceSettingsVariables(abo.boutonTexte, varContext);

    const getButtonHref = () => {
      if (!abo.boutonLien) return "#";
      if (!isPremium) return abo.boutonLien;

      try {
        const isRelative = abo.boutonLien.startsWith("/");
        const url = new URL(abo.boutonLien, "https://glift.io");
        url.searchParams.set("interval", interval);
        return isRelative ? `${url.pathname}${url.search}${url.hash}` : url.toString();
      } catch {
        const sep = abo.boutonLien.includes("?") ? "&" : "?";
        return `${abo.boutonLien}${sep}interval=${interval}`;
      }
    };

    return (
      <div className={`relative bg-white border border-[#D7D4DC] rounded-[20px] overflow-hidden p-[20px] md:p-[30px] flex flex-col text-center w-full max-w-[466px] transition-shadow duration-200 ${
        isPremium
          ? "order-1 md:order-2 md:min-h-[630px] shadow-glift-hover hover:shadow-glift-hover-strong"
          : "order-2 md:order-1 shadow-glift hover:shadow-glift-hover"
      }`}>
        {isPremium && abo.badge && (abo.badgeStatus !== "OFF") && (
          <div className="hidden md:block absolute top-0 right-0 overflow-hidden w-[180px] h-[180px]">
            <div
              className="absolute text-white text-[14px] font-bold uppercase rotate-45 w-[200px] text-center py-1 right-[-40px] top-[45px] shadow-glift"
              style={{
                background: abo.badgeColor || "#7069FA",
                color: abo.badgeTextColor || "#FFFFFF",
              }}
            >
              {formattedBadge}
            </div>
          </div>
        )}

        <div className="flex justify-center items-center h-[35px] mb-[10px]">
          <Image
            src={isPremium ? "/icons/diamant_premium_big.svg" : "/icons/diamant_starter_big.svg"}
            alt={isPremium ? "Abonnement Premium" : "Abonnement Starter"}
            width={42}
            height={35}
            className="object-contain"
          />
        </div>

        <h2 className="text-[#3A416F] font-bold text-[18px]">
          {formattedNom?.toLowerCase() === "starter"
            ? "Abonnement Starter"
            : formattedNom?.toLowerCase() === "premium"
            ? "Abonnement Premium"
            : formattedNom}
        </h2>
        <p className="text-[#3A416F] font-bold text-[36px] leading-tight pt-[10px] pb-[10px]">
          {isFree ? (
            "Gratuit"
          ) : (
            <>
              {priceDisplay} €<span className="text-[15px] md:text-[16px] font-semibold">{periodDisplay}</span>
            </>
          )}
        </p>
        <div 
          className="text-[#5D6494] text-[14px] md:text-[16px] font-semibold leading-relaxed pb-[20px] prose prose-sm max-w-[350px] mx-auto [&_p]:mb-0"
          dangerouslySetInnerHTML={{
            __html: formattedDescription
          }}
        />

        <ul className="text-[#5D6494] text-left text-[14px] md:text-[16px] space-y-3 font-semibold">
          {abo.arguments.map((arg) => (
            <li key={arg.id} className={`flex items-start gap-[5px] md:gap-2 ${!arg.active ? "text-[#B1BACC] line-through" : ""}`}>
              <Image 
                src={arg.active ? "/icons/inclus.svg" : "/icons/exclus.svg"} 
                alt={arg.active ? "Check" : "Cross"} 
                width={30} 
                height={30} 
                className="w-[26px] h-[26px] md:w-[30px] md:h-[30px] flex-shrink-0 object-contain"
              />
              <>
                <style>{`
                  .pricing-arg-text a, .pricing-arg-text a * {
                    color: #7069FA !important;
                    text-decoration: none !important;
                    transition: color 0.2s ease !important;
                  }
                  .pricing-arg-text a:hover, .pricing-arg-text a:hover * {
                    color: #6660E4 !important;
                  }
                `}</style>
                <div 
                  className="pricing-arg-text pt-[2px] md:pt-[3px] prose prose-sm max-w-none [&_p]:mb-0 [&_b]:text-[#3A416F] [&_strong]:text-[#3A416F]"
                  dangerouslySetInnerHTML={{ __html: replaceSettingsVariables(arg.texte, varContext) }}
                />
              </>
            </li>
          ))}
        </ul>

        {/* Bouton */}
        <div className="mt-auto pt-[30px] flex flex-col items-center gap-2">
          {abo.boutonType !== "aucun" && (
            abo.boutonType === "primaire" ? (
              <CTAButton href={getButtonHref()} className="font-semibold w-full md:w-auto">
                {formattedBoutonTexte}
              </CTAButton>
            ) : (
              <Link
                href={getButtonHref()}
                className="inline-flex items-center justify-center h-[44px] w-full md:w-auto px-[30px] border border-[#3A416F] text-[#3A416F] hover:text-white hover:bg-[#3A416F] font-semibold rounded-full transition-all duration-300 group"
              >
                {formattedBoutonTexte}
              </Link>
            )
          )}
          
          {isPremium && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-[#5D6494] text-[14px] font-semibold">
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute -inset-0.5 rounded-full bg-[#00D591] opacity-65 animate-ping"></span>
                <span className="relative w-2 h-2 rounded-full bg-[#00D591]"></span>
              </span>
              <span>{trialDays < 1 ? "1 heure" : `${trialDays} jours`} pour tester</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!abonnement1 || !abonnement2) {
    // Default values if none provided (for static /tarifs page if not passed)
    return <div className="text-center p-10">Configuration des tarifs manquante.</div>;
  }

  return (
    <div className="flex flex-col items-center w-full">
      {showToggle && (
        <div className="flex items-center justify-center gap-[10px] mb-[30px] md:mb-[40px]">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={`text-[16px] transition-colors cursor-pointer select-none ${
              interval === "monthly"
                ? "text-[#3A416F] font-bold"
                : "text-[#5D6494] font-semibold hover:text-[#3A416F]"
            }`}
          >
            Mensuel
          </button>

          <ToggleSwitch
            checked={interval === "yearly"}
            onCheckedChange={(checked) => setInterval(checked ? "yearly" : "monthly")}
            isAdmin={false}
            ariaLabel="Basculer entre abonnement mensuel et annuel"
          />

          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={`text-[16px] transition-colors cursor-pointer select-none ${
              interval === "yearly"
                ? "text-[#3A416F] font-bold"
                : "text-[#5D6494] font-semibold hover:text-[#3A416F]"
            }`}
          >
            Annuel
          </button>

          {discountPercent > 0 && (
            <span className="text-[10px] font-bold text-[#00D591] bg-[#DCFAF1] px-[10px] py-[2px] rounded-full h-[20px] inline-flex items-center justify-center select-none whitespace-nowrap leading-none">
              Économise {discountPercent} %
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
        {renderAbo(abonnement1)}
        {renderAbo(abonnement2, true)}
      </div>
    </div>
  );
}
