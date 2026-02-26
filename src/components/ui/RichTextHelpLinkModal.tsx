import { useEffect, useRef, useState } from "react";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";

interface RichTextHelpLinkModalProps {
    initialText: string;
    onCancel: () => void;
    onSave: (helpId: string, text: string) => void;
}

export default function RichTextHelpLinkModal({ initialText, onCancel, onSave }: RichTextHelpLinkModalProps) {
    const [helpId, setHelpId] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [textInput, setTextInput] = useState(initialText);

    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, []);

    return (
        <Modal
            open
            title="Ajouter un lien vers une aide"
            onClose={onCancel}
            footer={
                <div className="flex justify-center gap-5">
                    <CTAButton
                        variant="secondary"
                        onClick={onCancel}
                    >
                        Annuler
                    </CTAButton>
                    <CTAButton
                        onClick={() => {
                            if (helpId.trim()) {
                                onSave(helpId.trim(), textInput);
                            } else {
                                alert("Veuillez entrer l'ID de l'aide.");
                            }
                        }}
                    >
                        Enregistrer
                    </CTAButton>
                </div>
            }
        >
            <div className="mb-4">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Texte</label>
                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#5D6494] hover:border-[#C2BFC6] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                />
            </div>

            <div className="mb-6">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">Lien</label>
                <input
                    ref={inputRef}
                    type="text"
                    value={helpId}
                    onChange={(e) => setHelpId(e.target.value)}
                    placeholder="Insérez l'ID de l'aide"
                    className="h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#5D6494] transition-all duration-150 placeholder-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
                />
            </div>
        </Modal>
    );
}
