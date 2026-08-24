import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";

interface ProgramHideWarningModalProps {
    show: boolean;
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
}

export default function ProgramHideWarningModal({ show, onCancel, onConfirm }: ProgramHideWarningModalProps) {
    return (
        <Modal
            open={show}
            title="Masquer ce programme"
            onClose={onCancel}
            footer={
                <div className="flex justify-center gap-3 sm:gap-5 w-full">
                    <CTAButton
                        variant="secondary"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCancel();
                        }}
                        type="button"
                        className="flex-1 w-full sm:w-auto sm:flex-initial"
                    >
                        Annuler
                    </CTAButton>
                    <CTAButton
                        variant="danger"
                        onClick={() => onConfirm()}
                        loadingText=""
                        className="flex-1 w-full sm:w-auto sm:flex-initial"
                    >
                        Confirmer
                    </CTAButton>
                </div>
            }
        >
            <ModalMessage
                variant="warning"
                title="Attention"
                description="Si tu masques le programme contenant ton seul entraînement actif, tu n’auras plus d’entraînement disponible dans l’app."
                className="mb-6"
            />

            <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494] mb-4">
                En cliquant sur <span className="text-[#3A416F]">« Confirmer »</span> le programme contenant ton seul entraînement actif sera masqué et ne sera donc plus disponible sur l’application mobile. Tu pourras toujours le démasquer.
            </p>
            <p className="mb-6 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                Si ce n’est pas ce que tu souhaites faire, tu trouveras peut-être la solution à ton besoin dans la partie <a href="#" className="text-[#3A416F] underline">Aide</a> du site.
            </p>
        </Modal>
    );
}
