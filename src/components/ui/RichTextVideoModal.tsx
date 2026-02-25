import { useEffect, useRef, useState } from "react";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";

interface RichTextVideoModalProps {
    onCancel: () => void;
    onSave: (url: string) => void;
}

export default function RichTextVideoModal({ onCancel, onSave }: RichTextVideoModalProps) {
    const [url, setUrl] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, []);

    const normalizeLink = (rawUrl: string) => {
        const trimmed = rawUrl.trim();
        if (trimmed === "") return "";

        try {
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

    return (
        <Modal
            open
            title="Insérer une vidéo"
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
                            const normalizedLink = normalizeLink(url);
                            if (normalizedLink) {
                                onSave(normalizedLink);
                            } else {
                                alert("Veuillez entrer une URL valide.");
                            }
                        }}
                    >
                        Enregistrer
                    </CTAButton>
                </div>
            }
        >
            <div className="mb-6">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px] block">URL de la vidéo YouTube</label>
                <input
                    ref={inputRef}
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Insérez l'url ici"
                    className="h-[45px] w-full rounded-[5px] border border-[#D7D4DC] px-[15px] text-[16px] font-semibold text-[#5D6494] transition-all duration-150 placeholder-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]"
                />
            </div>
        </Modal>
    );
}
