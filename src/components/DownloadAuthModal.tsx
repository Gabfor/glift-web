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
      title={
        isRestricted ? (
          "Téléchargement bloqué"
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.5774 7.5C22.7321 5.5 25.2679 5.5 26.4226 7.5L43.7428 37.5C44.8975 39.5 43.6296 42 41.3202 42H6.6798C4.3704 42 3.10246 39.5 4.25716 37.5L21.5774 7.5Z" fill="#7069FA" />
              <path d="M24 18V27" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="24" cy="33" r="2" fill="white" />
            </svg>
            <span>Téléchargement impossible</span>
          </div>
        )
      }
      onClose={onClose}
      footer={
        <div className="flex justify-center gap-4">
          {isRestricted ? (
            <>
              <CTAButton
                variant="secondary"
                onClick={onClose}
              >
                Annuler
              </CTAButton>
              <CTAButton
                onClick={() => {
                  onClose();
                  router.push("/compte#mon-abonnement");
                }}
              >
                Débloquer
              </CTAButton>
            </>
          ) : (
            <>
              <CTAButton
                variant="secondary"
                onClick={() => {
                  onClose();
                  router.push("/connexion");
                }}
              >
                Connexion
              </CTAButton>
              <CTAButton
                onClick={() => {
                  onClose();
                  router.push("/tarifs");
                }}
              >
                Inscription
              </CTAButton>
            </>
          )}
        </div>
      }
    >
      <ModalMessage
        variant="info"
        title={
          isRestricted
            ? "Attention"
            : "Pourquoi le téléchargement est impossible ?"
        }
        description={
          isRestricted
            ? "Le téléchargement de ce programme d’entraînements est bloqué car votre abonnement actuel vous limite à un seul entraînement de 10 exercices maximum."
            : "Le téléchargement d’un programme d’entraînement nécessite d’être connecté à un compte utilisateur actif."
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
        <div className="text-left text-[14px] font-semibold leading-normal text-[#5D6494] space-y-4">
          <p>
            Si tu n’as pas encore créé de compte, clique sur le bouton <span className="text-[#3A416F]">« Inscription »</span> ci-dessous et rejoins Glift en moins de 30 secondes. Aucun moyen de paiement n’est nécessaire et tu as 30 jours offerts pour tester.
          </p>
          <p>
            Si tu as déjà un compte, tu peux te connecter en cliquant sur le bouton <span className="text-[#3A416F]">« Connexion »</span> ci-dessous.
          </p>
        </div>
      )}
    </Modal>
  );
}
