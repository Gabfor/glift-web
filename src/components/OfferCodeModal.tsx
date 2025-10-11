import Image from "next/image";
import { useRef, useState } from "react";
import Tooltip from "@/components/Tooltip";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";

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

  return (
    <Modal
      open
      title={name}
      onClose={onCancel}
      titleClassName="order-2 mt-5 mb-5 text-center text-[18px] font-bold uppercase"
      contentClassName="flex flex-col items-center"
      footerWrapperClassName="order-6 w-full"
      footer={
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
          >
            Annuler
          </button>
          <CTAButton
            onClick={() => {
              onConfirm();
              window.open(link, "_blank");
            }}
          >
            <span className="inline-flex items-center gap-2">
              Aller sur le site
              <Image
                src="/icons/arrow.svg"
                alt="→"
                width={25}
                height={25}
                className="h-[25px] w-[25px]"
              />
            </span>
          </CTAButton>
        </div>
      }
    >
      {brandImage && (
        <div className="order-1 mb-4 mt-4 flex justify-center">
          <div className="relative h-[70px] w-[70px] overflow-hidden rounded-full border-[3px] border-white bg-white shadow-[0_0_10px_rgba(93,100,148,0.25)]">
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

      <div className="order-3 mb-3 w-full text-left text-[#3A416F]">
        <h3 className="mb-1 text-[14px] font-bold">Comment profiter de cette offre ?</h3>
        {modal === "Avec code" ? (
          <p className="text-[14px] font-semibold text-[#5D6494]">
            Pour profiter immédiatement de cette offre, copiez le code de réduction ci-dessous et collez-le dans votre panier.
          </p>
        ) : (
          <p className="text-[14px] font-semibold text-[#5D6494]">
            Aucun code n&apos;est nécessaire pour profiter de cette offre. Cliquez sur le bouton ci-dessous pour être automatiquement redirigé vers le site partenaire.
          </p>
        )}
      </div>

      {modal === "Avec code" && code && (
        <div className="order-4 mt-6 mb-6 flex w-[300px] justify-center">
          <div className="relative w-full">
            <input
              ref={inputRef}
              value={code}
              readOnly
              className="h-[45px] w-full cursor-default select-none rounded-[5px] border border-[#D7D4DC] px-[15px] pr-[40px] text-center text-[16px] font-bold text-[#5D6494] transition-all duration-150 hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Tooltip content="Copié !" delay={0} forceVisible={copied} disableHover>
                <button
                  onClick={handleCopy}
                  onMouseEnter={() => setHoveredCopy(true)}
                  onMouseLeave={() => setHoveredCopy(false)}
                  className="mt-[6px] p-1 transition"
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
                    className="h-5 w-5"
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {parsedCondition && (
        <div className="order-5 w-full text-left text-[#3A416F]">
          <h3 className="mb-1 text-[14px] font-bold">Conditions de l&apos;offre</h3>
          <p className="text-[14px] font-semibold text-[#5D6494]">
            {parsedCondition}
          </p>
        </div>
      )}
    </Modal>
  );
}
