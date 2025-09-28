import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import CTAButton from "@/components/CTAButton";

interface LinkModalProps {
  exercice: string;
  initialLink?: string;
  onCancel: () => void;
  onSave: (link: string, exercice: string) => void;
}

export default function LinkModal({ exercice, initialLink = "", onCancel, onSave }: LinkModalProps) {
  const [link, setLink] = useState(initialLink);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hoveredClose, setHoveredClose] = useState(false);
  const [exerciceInput, setExercice] = useState(exercice);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#2E3142] bg-opacity-60 z-50 flex items-center justify-center">
      <div className="relative bg-white p-8 rounded-[5px] w-[564px] shadow-lg">
        {/* Bouton de fermeture */}
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

        <h2 className="text-xl text-[#3A416F] text-[22px] font-bold mb-4 text-center">{initialLink.trim() ? "Modifier le lien" : "Ajouter un lien"}</h2>

        <div className="mb-4">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Exercice</label>
            <input
            type="text"
            value={exerciceInput}
            onChange={(e) => setExercice(e.target.value)}
            className="h-[45px] w-full text-[16px] font-semibold px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
            />
        </div>

        <div className="mb-6">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Lien</label>
          <input
            ref={inputRef}
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Insérez votre lien ici"
            className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
          />
        </div>

        <div className="flex justify-center gap-3">
          {initialLink ? (
            <button
              onClick={() => onSave("", exerciceInput)}
              className="px-4 py-2 font-semibold text-[#EF4F4E] hover:text-[#BA2524]"
            >
              Supprimer
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
            >
              Annuler
            </button>
          )}
          <CTAButton
            onClick={() => {
              if (link.trim() === "") {
                onSave("", exerciceInput);
              } else if (isValidUrl(link)) {
                onSave(link, exerciceInput);
              } else {
                alert("Veuillez entrer un lien valide (http ou https).");
              }
            }}
          >
            Enregistrer
          </CTAButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
