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
      title={
        <div className="flex flex-col items-center gap-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5774 7.5C22.7321 5.5 25.2679 5.5 26.4226 7.5L43.7428 37.5C44.8975 39.5 43.6296 42 41.3202 42H6.6798C4.3704 42 3.10246 39.5 4.25716 37.5L21.5774 7.5Z" fill="#7069FA" />
            <path d="M24 18V27" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="24" cy="33" r="2" fill="white" />
          </svg>
          <span>Offre bloquée</span>
        </div>
      }
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
        En cliquant sur <span className="text-[#3A416F] font-bold">« Débloquer »</span> tu seras redirigé vers ton compte où tu pourras souscrire à la formule d’abonnement Premium qui te donnera accès aux offres bloquées.
        <br />
        <br />
        En cliquant sur <span className="text-[#3A416F] font-bold">« Annuler »</span> aucun changement ne sera appliqué à ta formule d’abonnement et tu pourras continuer à profiter gratuitement de toutes les offres à l’exception des offres <span className="text-[#3A416F] font-bold">Premium</span>.
      </p>
    </Modal>
  );
}
