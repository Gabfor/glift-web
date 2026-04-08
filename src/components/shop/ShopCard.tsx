"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabase/types";
import OfferCodeModal from "@/components/OfferCodeModal";
import CTAButton from "@/components/CTAButton";


import { ShopOffer } from "@/types/shop";

type Props = {
  offer: ShopOffer;
  onOfferClick?: (offer: ShopOffer) => void;
};

export default function ShopCard({ offer, onOfferClick }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(() => {
    if (!offer.end_date || !offer.end_date.includes("-")) {
      return null;
    }

    const parsedEndDate = new Date(offer.end_date).getTime();
    return Number.isNaN(parsedEndDate) ? null : parsedEndDate - Date.now();
  });

  const handleClick = () => {
    if (onOfferClick) {
      onOfferClick(offer);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR");
  };

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  };

  useEffect(() => {
    if (!offer.end_date || !offer.end_date.includes("-")) {
      setTimeRemaining(null);
      return;
    }

    const end = new Date(offer.end_date).getTime();
    if (Number.isNaN(end)) {
      setTimeRemaining(null);
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;

    const updateCountdown = () => {
      const diff = end - Date.now();
      setTimeRemaining(Math.max(diff, 0));
      if (diff <= 0 && interval) {
        clearInterval(interval);
      }
    };

    updateCountdown();
    interval = setInterval(updateCountdown, 1000);
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [offer.end_date]);

  return (
    <div className="relative w-full max-w-[270px] bg-white rounded-[15px] border border-[#D7D4DC] overflow-hidden flex flex-col">

      <div className="relative w-full h-[180px]">
        <Image
          src={offer.image || "/placeholder.jpg"}
          alt={offer.image_alt || offer.name}
          fill
          className="object-cover rounded-t-[15px]"
          unoptimized
        />
      </div>

      {offer.brand_image && (
        <div className="flex justify-center -mt-8 relative z-10">
          {offer.shop_website ? (
            <a href={offer.shop_website} target="_blank" rel="noopener noreferrer">
              <div className="w-[70px] h-[70px] rounded-full border-[3px] border-white bg-white overflow-hidden shadow-[0_0_10px_rgba(93,100,148,0.25)] relative">
                <Image
                  src={offer.brand_image}
                  alt={offer.brand_image_alt || "Partenaire"}
                  fill
                  sizes="100%"
                  className="object-cover"
                  unoptimized
                />
              </div>
            </a>
          ) : (
            <div className="w-[70px] h-[70px] rounded-full border-[3px] border-white bg-white overflow-hidden shadow-[0_0_10px_rgba(93,100,148,0.25)] relative">
              <Image
                src={offer.brand_image}
                alt={offer.brand_image_alt || "Partenaire"}
                fill
                sizes="100%"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
      )}

      <div className="pt-2.5 px-2.5 flex-1 flex flex-col">
        <h3 className="text-[#2E3271] text-[16px] font-bold mb-[10px] uppercase text-left line-clamp-2 break-words h-[48px]">
          {offer.name}
        </h3>

        {/* Tags */}
        <div className="flex justify-start flex-wrap gap-[5px] mb-[10px] min-h-[32px]">
          {(() => {
            const tags: string[] = [];

            try {
              const raw: unknown = offer.type;

              if (Array.isArray(raw)) {
                tags.push(...(raw as string[]).map((v: string) => v.trim()));
              } else if (typeof raw === "string") {
                let parsed: unknown;

                try {
                  parsed = JSON.parse(raw);
                } catch {
                  parsed = (raw as string).split(",").map((v: string) => v.trim());
                }

                if (typeof parsed === "string") {
                  try {
                    parsed = JSON.parse(parsed);
                  } catch {
                    parsed = [];
                  }
                }

                if (Array.isArray(parsed)) {
                  (parsed as unknown[]).forEach((v) => {
                    if (typeof v === "string") {
                      tags.push(v.trim());
                    }
                  });
                }
              }
            } catch {
              // do nothing
            }

            const genderIcons =
              offer.gender === "Tous"
                ? [{ src: "/icons/mixte.svg", label: "mixte" }]
                : offer.gender === "Homme"
                  ? [{ src: "/icons/homme.svg", label: "homme" }]
                  : offer.gender === "Femme"
                    ? [{ src: "/icons/femme.svg", label: "femme" }]
                    : [];

            return (
              <>
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]"
                  >
                    {tag}
                  </span>
                ))}
                {genderIcons.map(({ src, label }) => (
                  <span
                    key={label}
                    className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] h-[25px] w-[25px] inline-flex items-center justify-center rounded-[5px]"
                    title={`Offre ${label}`}
                  >
                    <Image
                      src={src}
                      alt={`Icône ${label}`}
                      width={14}
                      height={14}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Offre {label}</span>
                  </span>
                ))}
              </>
            );
          })()}
        </div>

        {/* Dates et livraison */}
        <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
          <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
          Valide depuis le :{" "}
          <span className="ml-auto text-[#3A416F] font-semibold">{formatDate(offer.start_date)}</span>
        </div>

        {(() => {
          if (!offer.end_date || !offer.end_date.includes("-")) {
            return (
              <div className="text-[14px] text-[#D7D4DC] font-semibold mb-[10px] text-left flex items-center gap-1">
                <Image src="/icons/check_offer_cross.svg" alt="check" width={20} height={20} />
                Aucune date d&apos;expiration
              </div>
            );
          }

          const end = new Date(offer.end_date).getTime();
          if (Number.isNaN(end)) {
            return (
              <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
                <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
                Date d&apos;expiration invalide
              </div>
            );
          }

          const diffMs =
            typeof timeRemaining === "number" ? timeRemaining : end - Date.now();
          const dayMs = 24 * 60 * 60 * 1000;
          const diffDays = Math.ceil(diffMs / dayMs);

          if (diffMs <= 0) {
            return (
              <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
                <Image src="/icons/check_offer_cross.svg" alt="expired" width={20} height={20} />
                Offre expirée
              </div>
            );
          }

          if (diffMs < dayMs) {
            return (
              <div className="text-[14px] font-semibold mb-[10px] text-left flex items-center gap-1 text-[#5D6494]">
                <Image src="/icons/check_end_very_soon.svg" alt="ending very soon" width={20} height={20} />
                L’offre expire dans :
                <span className="ml-auto text-[#EF4F4E] font-semibold">
                  {formatCountdown(diffMs)}
                </span>
              </div>
            );
          }

          if (diffDays <= 3 && diffDays >= 1) {
            return (
              <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
                <Image src="/icons/check_end_soon.svg" alt="ending soon" width={20} height={20} />
                L’offre expire dans :{" "}
                <span className="ml-auto text-[#F0C863] font-semibold">{diffDays} jours</span>
              </div>
            );
          }

          return (
            <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
              <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
              L’offre expire dans :{" "}
              <span className="ml-auto text-[#3A416F] font-semibold">{diffDays} jours</span>
            </div>
          );
        })()}

        <div className="text-[14px] font-semibold text-left flex items-center gap-1 min-h-[20px]">
          {(() => {
            const raw = offer.shipping ?? "";
            const shippingValue = parseFloat(
              typeof raw === "string" ? raw.replace(",", ".") : String(raw)
            );

            if (shippingValue === 0) {
              return (
                <>
                  <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
                  <span className="text-[#5D6494]">Livraison offerte</span>
                </>
              );
            }

            if (!isNaN(shippingValue) && shippingValue > 0) {
              return (
                <>
                  <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
                  <div className="flex justify-between w-full text-[#5D6494]">
                    <span>Livraison offerte dès :</span>
                    <span className="text-[#3A416F] font-semibold">
                      {shippingValue
                        .toLocaleString("fr-FR", {
                          minimumFractionDigits: shippingValue % 1 === 0 ? 0 : 2,
                          maximumFractionDigits: 2,
                        })} €
                    </span>
                  </div>
                </>
              );
            }

            return (
              <>
                <Image src="/icons/check_offer_cross.svg" alt="no-check" width={20} height={20} />
                <span className="text-[#D7D4DC]">La livraison n’est pas offerte</span>
              </>
            );
          })()}
        </div>

        <div className="min-h-[84px] flex items-center justify-center">
            <CTAButton
            onClick={handleClick}
            className="mt-[20px] mb-[20px] mx-auto"
            >
            En profiter
            <Image
                src="/icons/arrow.svg"
                alt="Flèche"
                width={25}
                height={25}
                className="ml-[-5px]"
            />
            </CTAButton>
        </div>
      </div>
    </div>
  );
}
