import { useState } from "react";
import Image from "next/image";
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

  const title = initialNote && initialNote !== '<p></p>' ? "Modifier la note" : "Ajouter une note";

  return (
    <Modal
      open
      title={
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/icons/note_purple.svg"
            alt="Note"
            width={35}
            height={35}
            priority
          />
          <span>{title}</span>
        </div>
      }
      onClose={onCancel}
      footer={
        <div className="flex justify-center gap-3 sm:gap-4 w-full">
          {initialNote ? (
            <button
              type="button"
              onClick={() => onSave("")}
              className="flex-1 w-full sm:w-auto sm:flex-initial sm:min-w-[136px] h-[44px] flex items-center justify-center px-4 font-semibold text-[#EF4F4E] hover:text-[#BA2524] transition-colors"
            >
              Supprimer
            </button>
          ) : (
            <CTAButton
              variant="secondary"
              onClick={onCancel}
              className="flex-1 w-full sm:w-auto sm:flex-initial sm:min-w-[136px]"
            >
              Annuler
            </CTAButton>
          )}
          <CTAButton onClick={() => onSave(note)} className="flex-1 w-full sm:w-auto sm:flex-initial sm:min-w-[136px]">
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
          minimal
        />
      </div>
    </Modal>
  );
}
