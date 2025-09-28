import Image from "next/image";
import { useRef, useState } from "react";
import ReactDOM from "react-dom";
import Tooltip from "@/components/Tooltip";

interface OfferModalProps {
  name: string;
  brandImage?: string;
  code?: string;
  link: string;
  modal: "Avec code" | "Sans code";
  condition?: string;
  endDate?: string;
  shopWebsite?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function OfferModal({
  name,
  brandImage,
  code,
  link,
  modal,
  condition,
  shopWebsite,
  endDate,
  onCancel,
  onConfirm,
}: OfferModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hoveredClose, setHoveredClose] = useState(false);
  const [hoveredCopy, setHoveredCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Erreur lors de la copie :", err);
    }
  };

  function formatDate(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const cleanedSite = (shopWebsite || "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^fr\./, "")
    .replace(/\/.*$/, "");

  const parsedCondition = condition
    ?.replace(/\{date\}/gi, formatDate(endDate))
    ?.replace(/\{site\}/gi, cleanedSite);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#2E3142] bg-opacity-60 z-50 flex items-center justify-center">
      <div className="relative bg-white p-8 rounded-[5px] w-[564px] shadow-lg">
        {/* Fermer */}
        <button
          onClick={onCancel}
          onMouseEnter={() => setHoveredClose(true)}
          onMouseLeave={() => setHoveredClose(false)}
          className="absolute top-4 right-4 w-6 h-6"
        >
          <Image
            src={hoveredClose ? "/icons/close_hover.svg" : "/icons/close.svg"}
            alt="Fermer"
            width={24}
            height={24}
            className="w-full h-full"
          />
        </button>

        {/* Logo partenaire */}
        {brandImage && (
          <div className="flex justify-center mt-4 mb-4">
            <div className="w-[70px] h-[70px] rounded-full border-[3px] border-white bg-white overflow-hidden shadow-[0_0_10px_rgba(93,100,148,0.25)] relative">
              <Image
                src={brandImage}
                alt="Partenaire"
                fill
                sizes="100%"
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Titre */}
        <h2 className="text-center text-[18px] text-[#3A416F] font-bold mt-5 mb-5 uppercase">
          {name}
        </h2>

        {/* Texte explicatif */}
        <div className="text-left text-[#3A416F] mb-3">
          <h3 className="text-[14px] font-bold mb-1">
            Comment profiter de cette offre ?
          </h3>
          {modal === "Avec code" ? (
            <p className="font-semibold text-[14px] text-[#5D6494]">
              Pour profiter immédiatement de cette offre, copiez le code de
              réduction ci-dessous et collez-le dans votre panier.
            </p>
          ) : (
            <p className="font-semibold text-[14px] text-[#5D6494]">
              Aucun code n&apos;est nécessaire pour profiter de cette offre. Cliquez
              sur le bouton ci-dessous pour être automatiquement redirigé vers le site
              partenaire.
            </p>
          )}
        </div>

        {/* Zone code + bouton copie */}
        {modal === "Avec code" && code && (
          <div className="flex justify-center mb-6 relative w-[300px] mx-auto mt-6">
            <input
              ref={inputRef}
              value={code}
              readOnly
              className="w-full h-[45px] text-center text-[16px] font-bold px-[15px] pr-[40px] rounded-[5px] bg-white text-[#5D6494]
                         border border-[#D7D4DC] hover:border-[#C2BFC6]
                         focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                         transition-all duration-150 select-none cursor-default"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Tooltip
                content="Copié !"
                delay={0}
                forceVisible={copied}
                disableHover
              >
                <button
                  onClick={handleCopy}
                  onMouseEnter={() => setHoveredCopy(true)}
                  onMouseLeave={() => setHoveredCopy(false)}
                  className="p-1 transition mt-[6px]"
                  title="Copier"
                >
                  <Image
                    src={
                      copied
                        ? "/icons/check.svg"
                        : hoveredCopy
                        ? "/icons/copy_hover.svg"
                        : "/icons/copy.svg"
                    }
                    alt="Copier"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Bloc "Conditions de l'offre" */}
        {parsedCondition && (
          <div className="text-left text-[#3A416F] mb-6">
            <h3 className="text-[14px] font-bold mb-1">Conditions de l&apos;offre</h3>
            <p className="font-semibold text-[14px] text-[#5D6494]">
              {parsedCondition}
            </p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              window.open(link, "_blank");
            }}
            className="inline-flex items-center justify-center gap-2 w-[180px] h-[44px] bg-[#7069FA] hover:bg-[#6660E4] text-white font-semibold rounded-full transition-all duration-300"
          >
            Aller sur le site
            <Image src="/icons/arrow.svg" alt="→" width={25} height={25} className="w-[25px] h-[25px]" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
