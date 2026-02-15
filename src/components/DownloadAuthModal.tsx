import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import Modal from "@/components/ui/Modal";
import ModalMessage from "@/components/ui/ModalMessage";

interface DownloadAuthModalProps {
  show: boolean;
  onClose: () => void;
  mode?: "auth" | "restricted";
}

export default function DownloadAuthModal({ show, onClose, mode = "auth" }: DownloadAuthModalProps) {
  const router = useRouter();

  const isRestricted = mode === "restricted";

  return (
    <Modal
      open={show}
      title={isRestricted ? "Téléchargement bloqué" : "Téléchargement impossible"}
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
              if (isRestricted) {
                router.push("/compte#mon-abonnement");
              } else {
                router.push("/tarifs");
              }
            }}
          >
            {isRestricted ? "Débloquer" : "Inscription"}
          </CTAButton>
        </div>
      }
    >
      <ModalMessage
        variant="info"
        title="Attention"
        description={
          isRestricted
            ? "Le téléchargement de ce programme d’entraînements est bloqué car votre abonnement actuel vous limite à un seul entraînement de 10 exercices maximum."
            : "Le téléchargement de ce programme d’entraînements est impossible car vous devez avoir préalablement créer un compte."
        }
        className="mb-6"
      />

      {isRestricted ? (
        <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
          En cliquant sur <span className="text-[#3A416F]">« Débloquer »</span> vous serez redirigé vers votre compte où vous pourrez choisir la formule d’abonnement Premium qui donne accès à un stockage illimité et débloquera ainsi ce programme.
          <br />
          <br />
          En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> aucun changement ne sera appliqué à votre abonnement et vous pourrez continuer à utiliser gratuitement un seul entraînement de 10 exercices maximum.
        </p>
      ) : (
        <p className="text-left text-[14px] font-semibold leading-normal text-[#5D6494]">
          En cliquant sur <span className="text-[#3A416F]">« Inscription »</span> vous serez redirigé vers une page où vous pourrez créer votre compte et choisir la formule d’abonnement qui convient à votre besoin.
          <br />
          <br />
          En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> vous resterez sur la page du Glift Store et vous pourrez continuer votre navigation.
        </p>
      )}
    </Modal>
  );
}
