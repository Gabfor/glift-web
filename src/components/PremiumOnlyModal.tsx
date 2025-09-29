import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";

interface PremiumOnlyModalProps {
  show: boolean;
  onClose: () => void;
}

export default function PremiumOnlyModal({ show, onClose }: PremiumOnlyModalProps) {
  const router = useRouter();

  return (
    <Modal
      open={show}
      title="Offre bloquée"
      onClose={onClose}
      footer={
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
          >
            Annuler
          </button>
          <CTAButton
            onClick={() => {
              onClose();
              router.push("/compte");
            }}
          >
            Débloquer
          </CTAButton>
        </div>
      }
    >
      <ModalMessage
        variant="info"
        title="Attention"
        description="Cette offre est bloquée car votre abonnement actuelle ne vous permet pas de profiter des offres réservées aux membres Premium."
        className="mb-6"
      />

      <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
        En cliquant sur <span className="text-[#3A416F]">« Débloquer »</span> vous serez redirigé vers votre compte où vous pourrez souscrire à la formule d’abonnement Premium qui vous donnera accès aux offres bloquées.
        <br />
        <br />
        En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à votre formule d’abonnement et vous pourrez continuer à profiter gratuitement de toutes les offres à l’exception des offres <span className="text-[#3A416F]">Premium</span>.
      </p>
    </Modal>
  );
}
