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
        <div className="flex justify-center gap-3 sm:gap-4 w-full">
          <CTAButton
            variant="secondary"
            onClick={onClose}
            className="flex-1 w-full sm:w-auto sm:flex-initial"
          >
            Annuler
          </CTAButton>
          <CTAButton
            onClick={() => {
              onClose();
              router.push("/compte#mon-abonnement");
            }}
            className="flex-1 w-full sm:w-auto sm:flex-initial"
          >
            Débloquer
          </CTAButton>
        </div>
      }
    >
      <ModalMessage
        variant="info"
        title="Attention"
        description="Cette offre est bloquée car ton abonnement actuel ne te permet pas de profiter des offres réservées aux membres Premium."
        className="mb-6"
      />

      <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
        En cliquant sur <span className="text-[#3A416F]">« Débloquer »</span> tu seras redirigé vers ton compte où tu pourras souscrire à la formule d’abonnement Premium qui te donnera accès aux offres bloquées.
        <br />
        <br />
        En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à ta formule d’abonnement et tu pourras continuer à profiter gratuitement de toutes les offres à l’exception des offres <span className="text-[#3A416F]">Premium</span>.
      </p>
    </Modal>
  );
}
