import { useEffect, useRef, useState } from "react";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";

interface NoteModalProps {
  initialNote: string;
  onCancel: () => void;
  onSave: (note: string) => void;
}

export default function NoteModal({ initialNote = "", onCancel, onSave }: NoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  const title = initialNote.trim() ? "Modifier la note" : "Ajouter une note";

  return (
    <Modal
      open
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-center gap-3">
          {initialNote ? (
            <button
              onClick={() => onSave("")}
              className="px-4 py-2 font-semibold text-[#EF4F4E] hover:text-[#BA2524]"
            >
              Supprimer
            </button>
          ) : (
            <CTAButton
              variant="secondary"
              onClick={onCancel}
            >
              Annuler
            </CTAButton>
          )}
          <CTAButton onClick={() => onSave(note.trim())}>
            Enregistrer
          </CTAButton>
        </div>
      }
    >
      <div className="mb-6">
        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Note</label>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajoutez vos notes ici"
          rows={4}
          className="w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[12px] rounded-[5px] bg-white text-[#5D6494] transition-all duration-150 border border-[#D7D4DC] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD] resize-none"
        />
      </div>
    </Modal>
  );
}
