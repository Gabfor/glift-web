import { useState } from "react";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface NoteModalProps {
  initialNote: string;
  onCancel: () => void;
  onSave: (note: string) => void;
}

export default function NoteModal({ initialNote = "", onCancel, onSave }: NoteModalProps) {
  const [note, setNote] = useState(initialNote);

  // Check if content has text (ignoring HTML tags for basic validation if needed, 
  // but for "is editing" logic, checking if string length > 0 or specific HTML structure is usually enough.
  // Here relying on string equivalence to initialNote or emptiness.)

  // Clean up empty HTML tags if user clears editor but leaves <p></p> ? 
  // For now we just pass the raw HTML string.

  const title = initialNote && initialNote !== '<p></p>' ? "Modifier la note" : "Ajouter une note";

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
          <CTAButton onClick={() => onSave(note)}>
            Enregistrer
          </CTAButton>
        </div>
      }
    >
      <div className="mb-6">
        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Note</label>
        <RichTextEditor
          value={note}
          onChange={setNote}
          placeholder="Ajoutez vos notes ici"
        />
      </div>
    </Modal>
  );
}
