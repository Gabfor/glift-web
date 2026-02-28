import React, { useState } from "react";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";
import FileUploader from "../forms/FileUploader";

interface RichTextImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string, alt: string, description: string) => void;
}

export default function RichTextImageModal({ isOpen, onClose, onSave }: RichTextImageModalProps) {
    const [fileUrls, setFileUrls] = useState<string[]>([]);
    const [alt, setAlt] = useState("");
    const [description, setDescription] = useState("");

    if (!isOpen) return null;

    const handleSave = () => {
        if (fileUrls.length === 0) {
            alert("Veuillez sélectionner au moins une image.");
            return;
        }

        const url = fileUrls[0];
        onSave(url, alt, description);
        handleClose();
    };

    const handleClose = () => {
        setFileUrls([]);
        setAlt("");
        setDescription("");
        onClose();
    };

    return (
        <Modal
            open={isOpen}
            title="Ajouter une image"
            onClose={handleClose}
            footer={
                <div className="flex justify-center gap-5">
                    <CTAButton
                        variant="secondary"
                        onClick={handleClose}
                    >
                        Annuler
                    </CTAButton>
                    <CTAButton
                        onClick={handleSave}
                        disabled={fileUrls.length === 0}
                    >
                        Enregistrer
                    </CTAButton>
                </div>
            }
        >
            <div className="mb-4">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
                    Pièces jointes
                </label>
                <FileUploader value={fileUrls} onChange={setFileUrls} accept="image/*" />
            </div>

            <div className="mb-4">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
                    Alt
                </label>
                <input
                    type="text"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder="Insérez votre texte alternatif ici"
                    className="h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#5D6494] hover:border-[#C2BFC6] transition-all duration-150 placeholder-[#D7D4DC] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                />
            </div>

            <div className="mb-6">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">
                    Description
                </label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description de l'image"
                    className="h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#5D6494] hover:border-[#C2BFC6] transition-all duration-150 placeholder-[#D7D4DC] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#A1A5FD]"
                />
            </div>
        </Modal>
    );
}
