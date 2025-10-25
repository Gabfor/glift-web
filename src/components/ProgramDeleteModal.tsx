import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";

interface ProgramDeleteModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function ProgramDeleteModal({ show, onCancel, onConfirm }: ProgramDeleteModalProps) {
  return (
    <Modal
      open={show}
      title="Supprimer un programme"
      onClose={onCancel}
      footer={
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
          >
            Annuler
          </button>
          <CTAButton
            variant="danger"
            className="w-[116px]"
            onClick={() => onConfirm()}
            loadingText="Suppression..."
          >
            Confirmer
          </CTAButton>
        </div>
      }
    >
      <ModalMessage
        variant="warning"
        title="Attention"
        description="La suppression d&apos;un programme d&apos;entraînements est définitive."
        className="mb-6"
      />

      <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
        En cliquant sur <span className="text-[#3A416F]">« Confirmer »</span> ce programme d’entraînements ainsi que l’ensemble des exercices encore à l’intérieur seront <span className="text-[#3A416F]">définitivement supprimés</span> de la plateforme et toute progression sera perdue.
      </p>
      <p className="mb-6 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
        Si ce n’est pas ce que vous souhaitez faire, vous trouverez peut-être la solution à votre besoin dans la partie <a href="#" className="text-[#3A416F] underline">Aide</a> du site.
      </p>
    </Modal>
  );
}
