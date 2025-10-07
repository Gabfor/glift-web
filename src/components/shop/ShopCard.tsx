"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import DownloadAuthModal from "@/components/DownloadAuthModal";
import PremiumOnlyModal from "@/components/PremiumOnlyModal";
import OfferCodeModal from "@/components/OfferCodeModal";
import CTAButton from "@/components/CTAButton";
import { useUser } from "@/context/UserContext";

type Props = {
  offer: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    type: string[] | string;
    code: string;
    image: string;
    image_alt: string;
    brand_image?: string;
    brand_image_alt?: string;
    shop?: string;
    shop_link?: string;
    shop_website?: string;
    shipping?: string;
    premium?: boolean;
    modal?: string;
    condition?: string;
  };
};

export default function ShopCard({ offer }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [lockedHover, setLockedHover] = useState(false);
  const [countdown, setCountdown] = useState("");
  const { user, isPremiumUser } = useUser() || {};
  const isAuthenticated = !!user;

  const supabase = createClient();

  const handleClick = async () => {
    if (offer.premium) {
      if (!isAuthenticated) {
        setShowModal(true);
        return;
      }
      if (!isPremiumUser) {
        setShowPremiumModal(true);
        return;
      }
    }

    try {
      await supabase.rpc("increment_offer_click", { offer_id: offer.id });
    } catch (error) {
      console.error("Erreur lors de l'incrémentation :", error);
    }

    if (offer.modal === "Avec code" || offer.modal === "Sans code") {
      setShowCodeModal(true);
    } else if (offer.shop_link) {
      window.open(offer.shop_link, "_blank");
    }
  };

  const handleModalConfirm = () => {
    setShowCodeModal(false);
    if (offer.shop_link) {
      window.open(offer.shop_link, "_blank");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR");
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(offer.end_date).getTime();
      const diff = end - now;

      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const pad = (n: number) => String(n).padStart(2, "0");
        setCountdown(`${hours}h ${pad(minutes)}m ${pad(seconds)}s`);
      }
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(interval);
  }, [offer.end_date]);

  return (
    <div className="relative w-full max-w-[270px] bg-white rounded-[5px] border border-[#ECE9F1] overflow-hidden flex flex-col shadow-glift hover:shadow-glift-hover transition-all duration-300 transform hover:-translate-y-1">
      {offer.premium && (
        <div className="absolute top-0 right-0 overflow-hidden w-[110px] h-[110px] z-10">
          <div className="absolute bg-[#7069FA] text-white text-[14px] font-semibold uppercase rotate-45 w-[150px] text-center py-[2px] right-[-30px] top-[30px] shadow-md tracking-wider">
            PREMIUM
          </div>
        </div>
      )}
      <Image
        src={offer.image || "/placeholder.jpg"}
        alt={offer.image_alt || offer.name}
        width={540}
        height={360}
        className="w-full h-[180px] object-cover rounded-t-[5px]"
        unoptimized
      />

      {offer.brand_image && (
        <div className="flex justify-center -mt-8">
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
        <h3 className="text-[#2E3271] text-[16px] font-bold mb-[10px] uppercase text-left">
          {offer.name}
        </h3>

        {/* Tags */}
        <div className="flex justify-start flex-wrap gap-[5px] mb-[10px]">
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

            return tags.map((tag, index) => (
              <span
                key={index}
                className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px]"
              >
                {tag}
              </span>
            ));
          })()}
        </div>

        {/* Dates et livraison */}
        <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
          <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
          Valide depuis le :{" "}
          <span className="ml-auto text-[#3A416F] font-bold">{formatDate(offer.start_date)}</span>
        </div>

        {(() => {
          if (!offer.end_date || !offer.end_date.includes("-")) {
            return (
              <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
                <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
                Aucune date d&apos;expiration
              </div>
            );
          }

          const now = new Date().getTime();
          const end = new Date(offer.end_date).getTime();
          const diffMs = end - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffMs < 24 * 60 * 60 * 1000) {
            return (
              <div className="text-[14px] font-semibold mb-[10px] text-left flex items-center gap-1 text-[#5D6494]">
                <Image src="/icons/check_end_very_soon.svg" alt="ending very soon" width={20} height={20} />
                L’offre expire dans :
                <span className="ml-auto text-[#EF4F4E] font-bold">{countdown}</span>
              </div>
            );
          }

          if (diffDays <= 3 && diffDays >= 1) {
            return (
              <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
                <Image src="/icons/check_end_soon.svg" alt="ending soon" width={20} height={20} />
                L’offre expire dans :{" "}
                <span className="ml-auto text-[#F0C863] font-bold">{diffDays} jours</span>
              </div>
            );
          }

          return (
            <div className="text-[14px] text-[#5D6494] font-semibold mb-[10px] text-left flex items-center gap-1">
              <Image src="/icons/check_offer.svg" alt="check" width={20} height={20} />
              L’offre expire dans :{" "}
              <span className="ml-auto text-[#3A416F] font-bold">{diffDays} jours</span>
            </div>
          );
        })()}

        <div className="text-[14px] font-semibold text-left flex items-center gap-1">
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
                    <span className="text-[#3A416F] font-bold">
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
          
        {offer.premium ? (
          !isAuthenticated ? (
            <CTAButton
              onClick={() => setShowModal(true)}
              onMouseEnter={() => setLockedHover(true)}
              onMouseLeave={() => setLockedHover(false)}
              variant="inactive"
              className="mt-[20px] mb-[30px] mx-auto font-semibold text-[16px]"
            >
              <span className="inline-flex items-center gap-2">
                <Image
                  src={`/icons/${lockedHover ? "locked_hover" : "locked"}.svg`}
                  alt=""
                  width={15}
                  height={15}
                />
                Profiter de cette offre
              </span>
            </CTAButton>
          ) : !isPremiumUser ? (
            <CTAButton
              onClick={() => setShowPremiumModal(true)}
              onMouseEnter={() => setLockedHover(true)}
              onMouseLeave={() => setLockedHover(false)}
              variant="inactive"
              className="mt-[20px] mb-[30px] mx-auto font-semibold text-[16px]"
            >
              <span className="inline-flex items-center gap-2">
                <Image
                  src={`/icons/${lockedHover ? "locked_hover" : "locked"}.svg`}
                  alt=""
                  width={15}
                  height={15}
                />
                Profiter de cette offre
              </span>
            </CTAButton>
          ) : (
            // Authentifié + premium → bouton actif
            <CTAButton
              onClick={handleClick}
              className="mt-[20px] mb-[30px] mx-auto font-semibold text-[16px]"
            >
              Profiter de cette offre
            </CTAButton>
          )
        ) : (
          // Offres non premium → toujours accessibles
          <CTAButton
            onClick={handleClick}
            className="mt-[20px] mb-[30px] mx-auto font-semibold text-[16px]"
          >
            Profiter de cette offre
          </CTAButton>
        )}
      </div>

      <DownloadAuthModal show={showModal} onClose={() => setShowModal(false)} />
      <PremiumOnlyModal show={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      {showCodeModal && (
        <OfferCodeModal
          name={offer.name}
          brandImage={offer.brand_image}
          code={offer.code}
          link={offer.shop_link || ""}
          shopWebsite={offer.shop_website || ""}
          modal={(offer.modal || "Sans code") as "Avec code" | "Sans code"}
          condition={offer.condition}
          endDate={offer.end_date}
          onCancel={() => setShowCodeModal(false)}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
}