import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";

interface DownloadAuthModalProps {
  show: boolean;
  onClose: () => void;
}

export default function DownloadAuthModal({ show, onClose }: DownloadAuthModalProps) {
  const router = useRouter();

  return (
    <Modal
      open={show}
      title="Téléchargement impossible"
      onClose={onClose}
      footer={
        <div className="flex justify-center gap-4">
          <CTAButton
            variant="secondary"
            onClick={onClose}
          >
            Annuler
          </CTAButton>
          <CTAButton
            onClick={() => {
              onClose();
              router.push("/tarifs");
            }}
          >
            Créer un compte
          </CTAButton>
        </div>
      }
    >
      <ModalMessage
        variant="info"
        title="Attention"
        description="Le téléchargement de ce programme d’entraînements est impossible car vous devez avoir préalablement créé un compte."
        className="mb-6"
      />

      <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
        En cliquant sur <span className="text-[#3A416F]">« Créer un compte »</span> vous serez redirigé vers une page où vous pourrez créer votre compte en choisissant la formule d’abonnement qui convient à votre besoin.
        <br />
        <br />
        En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> vous resterez sur la page du Glift Store et vous pourrez continuer votre navigation.
      </p>
    </Modal>
  );
}
