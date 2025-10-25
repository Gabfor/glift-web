import { useEffect, useRef, useState } from "react";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";

interface LinkModalProps {
  exercice: string;
  initialLink?: string;
  onCancel: () => void;
  onSave: (link: string, exercice: string) => void;
}

export default function LinkModal({ exercice, initialLink = "", onCancel, onSave }: LinkModalProps) {
  const [link, setLink] = useState(initialLink);
  const inputRef = useRef<HTMLInputElement>(null);
  const [exerciceInput, setExercice] = useState(exercice);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const normalizeLink = (url: string) => {
    const trimmed = url.trim();
    if (trimmed === "") {
      return "";
    }

    try {
      // Lien déjà complet (avec http ou https)
      new URL(trimmed);
      return trimmed;
    } catch {
      try {
        const fallback = `https://${trimmed}`;
        new URL(fallback);
        return fallback;
      } catch {
        return null;
      }
    }
  };

  const title = initialLink.trim() ? "Modifier le lien" : "Ajouter un lien";

  return (
    <Modal
      open
      title={title}
      onClose={onCancel}
      footer={
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
              const normalizedLink = normalizeLink(link);

              if (normalizedLink === "") {
                onSave("", exerciceInput);
              } else if (normalizedLink) {
                onSave(normalizedLink, exerciceInput);
              } else {
                alert("Veuillez entrer un lien valide.");
              }
            }}
          >
            Enregistrer
          </CTAButton>
        </div>
      }
    >
      <div className="mb-4">
        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Exercice</label>
        <input
          type="text"
          value={exerciceInput}
          onChange={(e) => setExercice(e.target.value)}
          className="h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#5D6494] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
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
          className="h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#5D6494] transition-all duration-150 placeholder-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
        />
      </div>
    </Modal>
  );
}
