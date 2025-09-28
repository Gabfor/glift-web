import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface NoteModalProps {
  initialNote: string;
  onCancel: () => void;
  onSave: (note: string) => void;
}

export default function NoteModal({ initialNote = "", onCancel, onSave }: NoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hoveredClose, setHoveredClose] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

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
          <img
            src={hoveredClose ? "/icons/close_hover.svg" : "/icons/close.svg"}
            alt="Fermer"
            className="w-full h-full"
          />
        </button>

        <h2 className="text-xl text-[#3A416F] text-[22px] font-bold mb-4 text-center">{initialNote.trim() ? "Modifier la note" : "Ajouter une note"}</h2>

        <div className="mb-6">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Note</label>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ajoutez votre note ici"
            rows={4}
            className="w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[12px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD] resize-none"
          />
        </div>

        <div className="flex justify-center gap-3">
          {initialNote ? (
            <button
              onClick={() => onSave("")}
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
          <button
            onClick={() => onSave(note.trim())}
            className="inline-flex items-center justify-center gap-1 w-[116px] h-[44px] bg-[#7069FA] hover:bg-[#6660E4] text-white font-semibold rounded-full transition-all duration-300 group"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
