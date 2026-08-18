import Image from "next/image";
import { useRef, useState } from "react";
import Tooltip from "@/components/Tooltip";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";

interface OfferModalProps {
  name: string;
  description?: string;
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
  description,
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

    let copiedSuccess = false;

    // 1. Essai avec l'API moderne Clipboard si disponible (HTTPS / localhost)
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        copiedSuccess = true;
      } catch (err) {
        console.warn("navigator.clipboard.writeText non disponible ou refusé, fallback utilisé :", err);
      }
    }

    // 2. Fallback pour iOS WebKit et HTTP sans faire sauter l'écran
    if (!copiedSuccess) {
      try {
        const currentScrollY = window.scrollY || window.pageYOffset || 0;
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.top = `${currentScrollY}px`;
        textArea.style.left = "-9999px";
        textArea.style.fontSize = "16px";
        textArea.style.width = "1px";
        textArea.style.height = "1px";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);

        textArea.focus({ preventScroll: true });
        textArea.select();
        textArea.setSelectionRange(0, code.length);
        copiedSuccess = document.execCommand("copy");
        document.body.removeChild(textArea);

        // Retirer le focus pour éviter tout scroll automatique du navigateur mobile
        (document.activeElement as HTMLElement)?.blur();
      } catch (err) {
        console.error("Erreur lors de la copie fallback :", err);
      }
    }

    // Déclenchement du feedback visuel
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setHoveredCopy(false);
    }, 1500);
  };

  function formatDate(dateString?: string) {
    if (!dateString) return "";
    // Force local time interpretation if it's a simple date string to match mobile
    const finalDateStr = dateString.includes("-") && !dateString.includes("T") 
      ? `${dateString}T00:00:00` 
      : dateString;
    const date = new Date(finalDateStr);
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
      titleClassName="order-2 !mb-[10px] text-center text-[18px] font-bold uppercase text-[#3A416F]"
      contentClassName="flex flex-col items-center"
      footerWrapperClassName="order-6 w-full"
      footer={
        <div className="flex w-full justify-center gap-5">
          <CTAButton
            variant="secondary"
            onClick={onCancel}
            className="hidden md:inline-flex"
          >
            Annuler
          </CTAButton>
          <CTAButton
            className="w-full md:w-auto"
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

      {description && (
        <div
          className="order-2 text-center text-[14px] font-semibold text-[#5D6494] mb-5 [&>p]:m-0 [&>p]:inline"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      <div className="order-3 mb-3 w-full text-left text-[#3A416F]">
        <h3 className="mb-1 text-[14px] font-bold">Comment en profiter ?</h3>
        {modal === "Avec code" ? (
          <p className="text-[14px] font-semibold text-[#5D6494]">
            Pour en profiter immédiatement, copie le code de réduction ci-dessous et colle le dans ton panier.
          </p>
        ) : (
          <p className="text-[14px] font-semibold text-[#5D6494]">
            Aucun code n&apos;est nécessaire pour profiter de cette offre. Clique sur le bouton ci-dessous pour être automatiquement redirigé vers le site partenaire.
          </p>
        )}
      </div>

      {modal === "Avec code" && code && (
        <div className="order-4 mt-[10px] mb-[20px] flex w-[300px] justify-center">
          <div className="relative w-full">
            <input
              ref={inputRef}
              value={code}
              readOnly
              inputMode="none"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                handleCopy();
              }}
              className="h-[45px] w-full cursor-pointer select-none rounded-[5px] border border-[#D7D4DC] px-[15px] pr-[40px] text-center text-[16px] font-bold text-[#5D6494] transition-all duration-150 hover:border-[#C2BFC6] focus:outline-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Tooltip
                content={copied ? "Copié !" : "Copier"}
                forceVisible={copied}
                delay={100}
                offset={10}
              >
                <button
                  type="button"
                  onClick={handleCopy}
                  onMouseEnter={() => setHoveredCopy(true)}
                  onMouseLeave={() => setHoveredCopy(false)}
                  className="mt-[6px] p-1 transition cursor-pointer"
                  aria-label="Copier le code"
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
