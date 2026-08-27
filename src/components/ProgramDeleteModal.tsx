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
      title={
        <div className="flex flex-col items-center gap-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5774 7.5C22.7321 5.5 25.2679 5.5 26.4226 7.5L43.7428 37.5C44.8975 39.5 43.6296 42 41.3202 42H6.6798C4.3704 42 3.10246 39.5 4.25716 37.5L21.5774 7.5Z" fill="#EF4F4E" />
            <path d="M24 18V27" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="24" cy="33" r="2" fill="white" />
          </svg>
          <span>Supprimer un programme</span>
        </div>
      }
      onClose={onCancel}
      footer={
        <div className="flex justify-center gap-3 sm:gap-4 w-full">
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
        description="La suppression d&apos;un programme d&apos;entraînements est définitive."
        className="mb-6"
      />

      <p className="mb-4 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
        En cliquant sur <span className="text-[#3A416F] font-bold">« Confirmer »</span> ce programme d’entraînements ainsi que l’ensemble des exercices encore à l’intérieur seront <span className="text-[#3A416F] font-bold">définitivement supprimés</span> de la plateforme et toute progression sera perdue.
      </p>
      <p className="mb-6 text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
        Si ce n’est pas ce que tu souhaites faire, tu trouveras peut-être la solution à ton besoin dans la partie <a href="#" className="text-[#3A416F] font-bold underline">Aide</a> du site.
      </p>
    </Modal>
  );
}
