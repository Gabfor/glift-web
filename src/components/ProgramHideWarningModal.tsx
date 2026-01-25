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
                <div className="flex justify-center gap-5">
                    <CTAButton
                        variant="secondary"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCancel();
                        }}
                        type="button"
                    >
                        Annuler
                    </CTAButton>
                    <CTAButton
                        variant="danger"
                        onClick={() => onConfirm()}
                        loadingText=""
                    >
                        Confirmer
                    </CTAButton>
                </div>
            }
        >
            <ModalMessage
                variant="warning"
                title="Attention"
                description="Si vous masquez le programme contenant votre seul entraînement actif, vous n’aurez plus d’entraînement disponible dans l’app."
                className="mb-6"
            />

            <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494] mb-4">
                En cliquant sur <span className="text-[#3A416F]">« Confirmer »</span> le programme contenant votre seul entraînement actif sera masqué et ne sera donc plus disponible sur l’application mobile. Vous pourrez toujours le démasquer.
            </p>
            <p className="mb-6 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
                Si ce n’est pas ce que vous souhaitez faire, vous trouverez peut-être la solution à votre besoin dans la partie <a href="#" className="text-[#3A416F] underline">Aide</a> du site.
            </p>
        </Modal>
    );
}
