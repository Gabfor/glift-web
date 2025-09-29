import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";

interface ProgramDeleteModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
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
          <button
            onClick={onConfirm}
            className="inline-flex h-[44px] w-[116px] items-center justify-center gap-1 rounded-full bg-[#EF4F4E] font-semibold text-white transition-all duration-300 hover:bg-[#BA2524]"
          >
            Confirmer
          </button>
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
