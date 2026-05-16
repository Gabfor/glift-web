"use client";

import Link from "next/link";
import Image from "next/image";
import CTAButton from "@/components/CTAButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Subscription } from "@/app/admin/create-blog-article/blogArticleForm";

type PricingTableProps = {
  abonnement1?: Subscription;
  abonnement2?: Subscription;
};

export default function PricingTable({ abonnement1, abonnement2 }: PricingTableProps) {
  const { trialDays } = useSiteSettings();

  const renderAbo = (abo: Subscription, isPremium?: boolean) => {
    return (
      <div className={`relative bg-white border border-[#D7D4DC] rounded-[20px] p-6 pb-[50px] md:p-8 md:pb-[50px] flex flex-col text-center w-full max-w-[466px] ${isPremium ? "min-h-[640px]" : ""}`}>
        {isPremium && abo.badge && (
          <div className="absolute top-0 right-0 overflow-hidden w-[180px] h-[180px]">
            <div className="absolute bg-[#7069FA] text-white text-[14px] font-bold uppercase rotate-45 w-[200px] text-center py-1 right-[-40px] top-[45px] shadow-md">
              {abo.badge}
            </div>
          </div>
        )}

        <h2 className="uppercase text-[#3A416F] font-bold text-[20px] pt-[20px]">{abo.nom}</h2>
        <p className="text-[#2E3271] font-bold text-[40px] leading-tight pt-[15px] pb-[15px]">
          {abo.prix} €<span className="text-[20px] font-semibold">/mois</span>
        </p>
        <div 
          className="text-[#5D6494] text-[16px] font-semibold leading-relaxed pb-[30px] prose prose-sm max-w-none [&_p]:mb-0"
          dangerouslySetInnerHTML={{ __html: abo.description }}
        />

        <ul className="text-[#5D6494] text-left text-[16px] space-y-3 font-semibold">
          {abo.arguments.map((arg) => (
            <li key={arg.id} className={`flex items-start gap-2 ${!arg.active ? "text-[#B1BACC] line-through" : ""}`}>
              <Image 
                src="/icons/inclus.svg" 
                alt="Check" 
                width={30} 
                height={30} 
                className={!arg.active ? "grayscale opacity-60" : ""}
                style={arg.active ? { filter: "brightness(0) saturate(100%) invert(58%) sepia(91%) saturate(3025%) hue-rotate(120deg) brightness(95%) contrast(105%)" } : {}} // Green filter for active
              />
              <div 
                className="pt-[3px] prose prose-sm max-w-none [&_p]:mb-0 [&_b]:text-[#3A416F] [&_strong]:text-[#3A416F]"
                dangerouslySetInnerHTML={{ __html: arg.texte }}
              />
            </li>
          ))}
        </ul>

        {/* Bouton */}
        <div className="mt-auto pt-[30px] flex flex-col items-center gap-2">
          {abo.boutonType !== "aucun" && (
            abo.boutonType === "primaire" ? (
              <CTAButton href={abo.boutonLien || "#"} className="font-semibold w-full md:w-auto">
                {abo.boutonTexte}
                <Image
                  src="/icons/arrow.svg"
                  alt="Flèche blanche"
                  width={25}
                  height={25}
                  className="object-contain"
                />
              </CTAButton>
            ) : (
              <Link
                href={abo.boutonLien || "#"}
                className="inline-flex items-center justify-center gap-1 h-[44px] w-full md:w-auto px-[30px] border border-[#2E3271] text-[#2E3271] hover:text-white hover:bg-[#2E3271] font-semibold rounded-full transition-all duration-300 group"
              >
                {abo.boutonTexte}
                <div className="relative w-[25px] h-[25px]">
                  <Image
                    src="/icons/arrow_blue.svg"
                    alt="Flèche normale"
                    fill
                    className="object-contain transition-opacity group-hover:opacity-0"
                  />
                  <Image
                    src="/icons/arrow.svg"
                    alt="Flèche blanche"
                    fill
                    className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                  />
                </div>
              </Link>
            )
          )}
          
          {isPremium && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-[#5D6494] text-[14px] font-semibold">
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute w-full h-full rounded-full bg-[#00D591] opacity-50 animate-ping"></span>
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
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
      {renderAbo(abonnement1)}
      {renderAbo(abonnement2, true)}
    </div>
  );
}
